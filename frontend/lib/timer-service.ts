import { api } from "./api-config";
import localforage from "localforage";

export enum TimerStatus {
  RUNNING = "running",
  PAUSED = "paused",
  STOPPED = "stopped",
}

export interface TimeEntry {
  _id?: string;
  userId?: string;
  projectId?: string;
  personalTaskId?: string;
  sharedTaskId?: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: TimerStatus;
  pausedAt?: string[];
  resumedAt?: string[];
  syncedFromOffline?: boolean;
  offlineId?: string;
  date: string;
  projectName?: string;
  taskTitle?: string;
}

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  totalDuration: number;
  totalHours: number;
  entriesCount: number;
  byProject: Array<{
    projectId: string | null;
    projectName: string;
    duration: number;
    hours: number;
    percentage: number;
    entriesCount: number;
  }>;
  byDescription: Array<{
    description: string;
    duration: number;
    hours: number;
    percentage: number;
  }>;
  byDay: Array<{
    day: string;
    duration: number;
    hours: number;
  }>;
  entries: TimeEntry[];
}

// Configuration du stockage hors ligne
const offlineStorage = localforage.createInstance({
  name: "timerApp",
  storeName: "timeEntries",
});

const queueStorage = localforage.createInstance({
  name: "timerApp",
  storeName: "syncQueue",
});

// Générer un ID unique pour les entrées hors ligne
const generateOfflineId = () => `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const timerService = {
  // Démarrer le timer
  async start(data: {
    projectId?: string;
    personalTaskId?: string;
    sharedTaskId?: string;
    description?: string;
  }): Promise<TimeEntry> {
    try {
      const response = await api.post("/time-entries/timer/start", data);
      // Sauvegarder hors ligne
      await offlineStorage.setItem("activeTimer", response.data);
      return response.data;
    } catch (error) {
      // Mode hors ligne
      const offlineEntry: TimeEntry = {
        offlineId: generateOfflineId(),
        ...data,
        startTime: new Date().toISOString(),
        duration: 0,
        status: TimerStatus.RUNNING,
        date: new Date().toISOString().split("T")[0],
        syncedFromOffline: false,
      };
      
      await offlineStorage.setItem("activeTimer", offlineEntry);
      await queueStorage.setItem(offlineEntry.offlineId!, offlineEntry);
      
      return offlineEntry;
    }
  },

  // Mettre en pause
  async pause(): Promise<TimeEntry> {
    try {
      const response = await api.post("/time-entries/timer/pause");
      await offlineStorage.setItem("activeTimer", response.data);
      return response.data;
    } catch (error) {
      const activeTimer = await offlineStorage.getItem<TimeEntry>("activeTimer");
      if (activeTimer) {
        const now = new Date().toISOString();
        const elapsed = Math.floor((new Date(now).getTime() - new Date(activeTimer.startTime).getTime()) / 1000);
        
        activeTimer.duration += elapsed;
        activeTimer.status = TimerStatus.PAUSED;
        activeTimer.pausedAt = [...(activeTimer.pausedAt || []), now];
        
        await offlineStorage.setItem("activeTimer", activeTimer);
        if (activeTimer.offlineId) {
          await queueStorage.setItem(activeTimer.offlineId, activeTimer);
        }
        
        return activeTimer;
      }
      throw error;
    }
  },

  // Reprendre
  async resume(): Promise<TimeEntry> {
    try {
      const response = await api.post("/time-entries/timer/resume");
      await offlineStorage.setItem("activeTimer", response.data);
      return response.data;
    } catch (error) {
      const activeTimer = await offlineStorage.getItem<TimeEntry>("activeTimer");
      if (activeTimer) {
        const now = new Date().toISOString();
        
        activeTimer.status = TimerStatus.RUNNING;
        activeTimer.startTime = now;
        activeTimer.resumedAt = [...(activeTimer.resumedAt || []), now];
        
        await offlineStorage.setItem("activeTimer", activeTimer);
        if (activeTimer.offlineId) {
          await queueStorage.setItem(activeTimer.offlineId, activeTimer);
        }
        
        return activeTimer;
      }
      throw error;
    }
  },

  // Arrêter
  async stop(): Promise<TimeEntry> {
    try {
      const response = await api.post("/time-entries/timer/stop");
      await offlineStorage.removeItem("activeTimer");
      return response.data;
    } catch (error) {
      const activeTimer = await offlineStorage.getItem<TimeEntry>("activeTimer");
      if (activeTimer) {
        const now = new Date().toISOString();
        
        if (activeTimer.status === TimerStatus.RUNNING) {
          const elapsed = Math.floor((new Date(now).getTime() - new Date(activeTimer.startTime).getTime()) / 1000);
          activeTimer.duration += elapsed;
        }
        
        activeTimer.status = TimerStatus.STOPPED;
        activeTimer.endTime = now;
        
        if (activeTimer.offlineId) {
          await queueStorage.setItem(activeTimer.offlineId, activeTimer);
        }
        
        await offlineStorage.removeItem("activeTimer");
        return activeTimer;
      }
      throw error;
    }
  },

  // Récupérer le timer actif
  async getActive(): Promise<TimeEntry | null> {
    try {
      const response = await api.get("/time-entries/timer/active");
      await offlineStorage.setItem("activeTimer", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Vérifier le stockage local
        const activeTimer = await offlineStorage.getItem<TimeEntry>("activeTimer");
        return activeTimer;
      }
      throw error;
    }
  },

  // Créer une entrée manuelle
  async createEntry(data: Partial<TimeEntry>): Promise<TimeEntry> {
    try {
      const response = await api.post("/time-entries", data);
      return response.data;
    } catch (error) {
      const offlineEntry: TimeEntry = {
        offlineId: generateOfflineId(),
        ...data as TimeEntry,
        syncedFromOffline: false,
      };
      
      await queueStorage.setItem(offlineEntry.offlineId!, offlineEntry);
      return offlineEntry;
    }
  },

  // Mettre à jour une entrée
  async updateEntry(id: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
    const response = await api.put(`/time-entries/${id}`, data);
    return response.data;
  },

  // Supprimer une entrée
  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/time-entries/${id}`);
  },

  // Récupérer les entrées
  async getEntries(startDate?: string, endDate?: string): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(`/time-entries?${params.toString()}`);
    return response.data;
  },

  // Synchroniser les entrées hors ligne
  async syncOfflineEntries(): Promise<TimeEntry[]> {
    const queue: any[] = [];
    
    await queueStorage.iterate((value: any) => {
      if (!value.syncedFromOffline) {
        queue.push(value);
      }
    });

    if (queue.length === 0) {
      return [];
    }

    try {
      const response = await api.post("/time-entries/sync", { entries: queue });
      
      // Nettoyer la queue
      for (const entry of queue) {
        if (entry.offlineId) {
          await queueStorage.removeItem(entry.offlineId);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      throw error;
    }
  },

  // Vérifier l'état de connexion et synchroniser
  async checkAndSync(): Promise<void> {
    try {
      await this.syncOfflineEntries();
    } catch (error) {
      console.error("Synchronisation échouée:", error);
    }
  },

  // Récupérer un rapport
  async getReport(params: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
    userId?: string;
  }): Promise<ReportData> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.projectId) queryParams.append("projectId", params.projectId);
    if (params.userId) queryParams.append("userId", params.userId);

    const response = await api.get(`/time-entries/report?${queryParams.toString()}`);
    return response.data;
  },
};

// Fonction pour initialiser la synchronisation automatique
export const initAutoSync = () => {
  // Synchroniser toutes les 5 minutes si en ligne
  setInterval(async () => {
    if (navigator.onLine) {
      await timerService.checkAndSync();
    }
  }, 5 * 60 * 1000);

  // Synchroniser au retour en ligne
  window.addEventListener("online", async () => {
    await timerService.checkAndSync();
  });
};