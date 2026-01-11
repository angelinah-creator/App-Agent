"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Square, ChevronLeft, ChevronRight, Calendar, Wifi, WifiOff } from "lucide-react";
import { addWeeks, format, startOfWeek, endOfWeek, eachDayOfInterval, differenceInCalendarWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { timerService, TimeEntry, TimerStatus, initAutoSync } from "@/lib/timer-service";
import { projectService } from "@/lib/project-service";
import { personalTaskService, TaskStatus } from "@/lib/task-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const PIXELS_PER_HOUR = 64;

export function TimerSection() {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Queries
  const { data: activeTimer } = useQuery({
    queryKey: ["activeTimer"],
    queryFn: timerService.getActive,
    refetchInterval: 5000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["personalTasks"],
    queryFn: () => personalTaskService.getMyTasks({ status: TaskStatus.EN_COURS }),
  });

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const { data: entries = [] } = useQuery({
    queryKey: ["timeEntries", weekStart, weekEnd],
    queryFn: () => timerService.getEntries(weekStart.toISOString(), weekEnd.toISOString()),
  });

  // Mutations
  const startMutation = useMutation({
    mutationFn: timerService.start,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      setIsRunning(true);
      setIsPaused(false);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: timerService.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      setIsRunning(false);
      setIsPaused(true);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: timerService.resume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      setIsRunning(true);
      setIsPaused(false);
    },
  });

  const stopMutation = useMutation({
    mutationFn: timerService.stop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      setIsRunning(false);
      setIsPaused(false);
      setSeconds(0);
      setDescription("");
      setSelectedProject("");
      setSelectedTask("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) =>
      timerService.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: timerService.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
  });

  // Initialiser le timer actif
  useEffect(() => {
    if (activeTimer) {
      setDescription(activeTimer.description || "");
      setSelectedProject(activeTimer.projectId || "");
      setSelectedTask(activeTimer.personalTaskId || activeTimer.sharedTaskId || "");
      
      if (activeTimer.status === TimerStatus.RUNNING) {
        setIsRunning(true);
        setIsPaused(false);
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
        setSeconds(activeTimer.duration + elapsed);
      } else if (activeTimer.status === TimerStatus.PAUSED) {
        setIsRunning(false);
        setIsPaused(true);
        setSeconds(activeTimer.duration);
      }
    }
  }, [activeTimer]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync
  useEffect(() => {
    initAutoSync();
  }, []);

  const handleTimerAction = () => {
    if (!isRunning && !isPaused) {
      // Démarrer
      startMutation.mutate({
        projectId: selectedProject || undefined,
        personalTaskId: selectedTask || undefined,
        description: description || undefined,
      });
    } else if (isRunning) {
      // Pause
      pauseMutation.mutate();
    } else if (isPaused) {
      // Reprendre
      resumeMutation.mutate();
    }
  };

  const handleStop = () => {
    if (activeTimer) {
      stopMutation.mutate();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h${minutes.toString().padStart(2, "0")}m` : `${minutes}m`;
  };

  const weekDisplayText = useMemo(() => {
    return `${format(weekStart, "dd MMM", { locale: fr })} - ${format(weekEnd, "dd MMM yyyy", { locale: fr })} • W${format(weekStart, "w", { locale: fr })}`;
  }, [weekStart, weekEnd]);

  const weekTotalSeconds = useMemo(
    () => entries.reduce((acc, e) => acc + e.duration, 0),
    [entries]
  );

  // Convertir les entrées pour la grille
  const gridEntries = useMemo(() => {
    return entries.map((entry) => {
      const entryDate = new Date(entry.startTime);
      const dayIndex = entryDate.getDay() === 0 ? 6 : entryDate.getDay() - 1;
      const startHour = entryDate.getHours() + entryDate.getMinutes() / 60;
      const durationHours = entry.duration / 3600;

      return {
        ...entry,
        dayIndex,
        startHour,
        durationHours,
      };
    });
  }, [entries]);

  const handleEntryClick = (entry: any) => {
    setEditingEntry(entry);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !editingEntry._id) return;

    updateMutation.mutate({
      id: editingEntry._id,
      data: {
        description: editingEntry.description,
        projectId: editingEntry.projectId,
        duration: editingEntry.duration,
      },
    });
  };

  const handleDeleteEntry = () => {
    if (!editingEntry || !editingEntry._id) return;
    
    if (confirm("Supprimer cette entrée ?")) {
      deleteMutation.mutate(editingEntry._id);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-transparent -mb-8 -mt-8">
      {/* Status de connexion */}
      <div className={`fixed top-20 right-6 z-50 px-3 py-1 rounded-full text-xs font-medium ${isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
        {isOnline ? <Wifi size={14} className="inline mr-1" /> : <WifiOff size={14} className="inline mr-1" />}
        {isOnline ? "En ligne" : "Hors ligne"}
      </div>

      {/* TOP BAR */}
      <div className="border-b px-6 py-4 flex items-center gap-4 bg-transparent z-30 flex-shrink-0">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Sur quoi travaillez-vous ?"
          className="flex-1 text-lg outline-none text-white bg-transparent"
          disabled={isRunning || isPaused}
        />

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm text-white bg-[#0F0F12]"
          disabled={isRunning || isPaused}
        >
          <option value="">Sans projet</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm text-white bg-[#0F0F12]"
          disabled={isRunning || isPaused}
        >
          <option value="">Sans tâche</option>
          {tasks.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title}
            </option>
          ))}
        </select>

        <span className="font-mono text-xl w-[110px] text-center text-white">
          {formatTime(seconds)}
        </span>

        <button
          onClick={handleTimerAction}
          className={`px-4 py-2 rounded-md text-white ${isPaused ? "bg-blue-500" : isRunning ? "bg-yellow-500" : "bg-green-500"}`}
        >
          {isPaused ? <Play size={16} /> : isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {(isRunning || isPaused) && (
          <button onClick={handleStop} className="px-4 py-2 rounded-md bg-red-500 text-white">
            <Square size={16} />
          </button>
        )}
      </div>

      {/* WEEK HEADER */}
      <div className="border-b px-6 py-3 flex items-center justify-between bg-transparent text-white z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1 hover:bg-white/5 rounded-lg">
            <ChevronLeft />
          </button>
          <div className="flex items-center gap-2 bg-[#0F0F12] px-4 py-2 rounded-lg">
            <Calendar className="text-purple-400" size={18} />
            <span className="text-white font-medium">{weekDisplayText}</span>
          </div>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1 hover:bg-white/5 rounded-lg">
            <ChevronRight />
          </button>
        </div>
        <span className="text-sm font-medium font-mono">
          Total : {formatTime(weekTotalSeconds)}
        </span>
      </div>

      {/* DAYS HEADER */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-transparent text-white z-10 flex-shrink-0">
        <div />
        {DAYS.map((day, i) => {
          const dayTotal = gridEntries
            .filter((e) => e.dayIndex === i)
            .reduce((sum, e) => sum + e.duration, 0);
          return (
            <div key={day} className="text-center py-2 font-medium text-xl">
              {day}
              <p className="text-sm text-gray-400 font-mono">{formatTime(dayTotal)}</p>
            </div>
          );
        })}
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-auto">
        <div className="relative min-w-[900px]">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] h-16 border-b border-[#313442]">
              <div className="text-xs text-gray-400 px-2">{hour.toString().padStart(2, "0")}:00</div>
              {DAYS.map((_, i) => (
                <div key={i} className="border-l border-[#313442]" />
              ))}
            </div>
          ))}

          {gridEntries.map((entry) => (
            <div
              key={entry._id}
              onClick={() => handleEntryClick(entry)}
              className="absolute bg-purple-500 text-white rounded-md px-2 py-1 text-xs cursor-pointer hover:bg-purple-600 transition"
              style={{
                left: `calc(80px + ${entry.dayIndex} * (100% - 80px) / 7)`,
                top: entry.startHour * PIXELS_PER_HOUR,
                height: entry.durationHours * PIXELS_PER_HOUR,
                width: `calc((100% - 80px) / 7 - 8px)`,
              }}
            >
              <div className="font-medium truncate">{entry.description || "Sans description"}</div>
              {entry.projectName && <div className="text-[9px] opacity-80">{entry.projectName}</div>}
              <div className="text-[9px] mt-1">{formatDuration(entry.duration)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1F2128] rounded-xl p-6 w-[500px] border border-[#313442]">
            <h3 className="text-white text-lg font-semibold mb-4">Modifier l'entrée</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Description</label>
                <input
                  value={editingEntry.description || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  className="w-full bg-[#0F0F12] text-white px-3 py-2 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm">Durée</label>
                <input
                  type="text"
                  value={formatTime(editingEntry.duration)}
                  className="w-full bg-[#0F0F12] text-white px-3 py-2 rounded-lg mt-1"
                  disabled
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteEntry}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
                <button
                  onClick={handleUpdateEntry}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}