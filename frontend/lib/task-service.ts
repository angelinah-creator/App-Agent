// lib/task-service.ts
import { api } from "./api-config";

export enum TaskPriority {
  URGENTE = "urgente",
  ELEVEE = "élevée",
  NORMALE = "normale",
  BASSE = "basse",
}

export enum TaskStatus {
  A_FAIRE = "à faire",
  EN_COURS = "en cours",
  TERMINEE = "terminée",
  ANNULEE = "annulée",
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignees?: Array<{ // ICI: Rendre optionnel
    _id: string;
    nom?: string; // Rendre optionnel
    prenoms?: string; // Rendre optionnel
    email?: string;
  }>;
  sub_tasks: string[];
  parentTaskId?: string;
  personalUserId?: string;
  spaceId?: string;
  project_id?: {
    _id: string;
    name: string;
    description?: string;
  };
  createdBy?: {
    _id: string;
    nom?: string; // Rendre optionnel
    prenoms?: string; // Rendre optionnel
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignees?: string[];
  sub_tasks?: string[];
  project_id?: string;
}

export interface CreateSubtaskDto {
  title: string;
  description?: string;
  assignees?: string[]; // Uniquement pour les tâches partagées
  priority?: TaskPriority;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignees?: string[];
  sub_tasks?: string[];
  project_id?: string;
}

// Service pour les tâches personnelles
export const personalTaskService = {
  // Créer une tâche personnelle
  async create(data: CreateTaskDto): Promise<Task> {
    const response = await api.post(`/personal/tasks`, data);
    return response.data;
  },

  // Créer une sous-tâche
  async createSubtask(parentTaskId: string, data: CreateSubtaskDto): Promise<Task> {
    const response = await api.post(`/personal/tasks/${parentTaskId}/subtasks`, data);
    return response.data;
  },

  // Récupérer les sous-tâches
  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    const response = await api.get(`/personal/tasks/${parentTaskId}/subtasks`);
    return response.data;
  },

  // Récupérer les tâches personnelles
  async getMyTasks(filters?: {
    project_id?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    start_date?: string;
    end_date?: string;
  }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.project_id) params.append("project_id", filters.project_id);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);

    const url = `/personal/tasks${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Récupérer une tâche spécifique
  async getById(taskId: string): Promise<Task> {
    const response = await api.get(`/personal/tasks/${taskId}`);
    return response.data;
  },

  // Mettre à jour une tâche
  async update(taskId: string, data: UpdateTaskDto): Promise<Task> {
    const response = await api.put(`/personal/tasks/${taskId}`, data);
    return response.data;
  },

  // Supprimer une tâche
  async delete(taskId: string): Promise<void> {
    await api.delete(`/personal/tasks/${taskId}`);
  },

  // Statistiques
  async getStats(): Promise<{
    total: number;
    completed: number;
    byStatus: Array<{ _id: string; count: number }>;
  }> {
    const response = await api.get("/personal/tasks/stats");
    return response.data;
  },
};

// Service pour les tâches partagées
export const sharedTaskService = {
  // Créer une tâche dans un espace
  async create(spaceId: string, data: CreateTaskDto): Promise<Task> {
    const response = await api.post(`/shared/spaces/${spaceId}/tasks`, data);
    return response.data;
  },

  // Créer une sous-tâche
  async createSubtask(spaceId: string, parentTaskId: string, data: CreateSubtaskDto): Promise<Task> {
    const response = await api.post(`/shared/spaces/${spaceId}/tasks/${parentTaskId}/subtasks`, data);
    return response.data;
  },

  // Récupérer les sous-tâches
  async getSubtasks(spaceId: string, parentTaskId: string): Promise<Task[]> {
    const response = await api.get(`/shared/spaces/${spaceId}/tasks/${parentTaskId}/subtasks`);
    return response.data;
  },

  // Récupérer les tâches d'un espace
  async getSpaceTasks(
    spaceId: string,
    filters?: {
      assignee?: string;
      project_id?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.assignee) params.append("assignee", filters.assignee);
    if (filters?.project_id) params.append("project_id", filters.project_id);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);

    const url = `/shared/spaces/${spaceId}/tasks${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Récupérer une tâche spécifique
  async getById(spaceId: string, taskId: string): Promise<Task> {
    const response = await api.get(`/shared/spaces/${spaceId}/tasks/${taskId}`);
    return response.data;
  },

  // Mettre à jour une tâche
  async update(
    spaceId: string,
    taskId: string,
    data: UpdateTaskDto
  ): Promise<Task> {
    const response = await api.put(
      `/shared/spaces/${spaceId}/tasks/${taskId}`,
      data
    );
    return response.data;
  },

  // Supprimer une tâche
  async delete(spaceId: string, taskId: string): Promise<void> {
    await api.delete(`/shared/spaces/${spaceId}/tasks/${taskId}`);
  },

  // Statistiques d'un espace
  async getStats(spaceId: string): Promise<{
    total: number;
    completed: number;
    byStatus: Array<{ _id: string; count: number }>;
  }> {
    const response = await api.get(`/shared/spaces/${spaceId}/tasks/stats`);
    return response.data;
  },
};