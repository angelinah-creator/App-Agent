"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  addWeeks,
  addMonths,
  subMonths,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameWeek,
  differenceInCalendarWeeks,
  addDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  timerService,
  TimeEntry,
  TimerStatus,
  initAutoSync,
} from "@/lib/timer-service";
import { projectService } from "@/lib/project-service";
import {
  personalTaskService,
  sharedTaskService,
  TaskStatus,
} from "@/lib/task-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskBlock } from "./timer/task-block";
import { TaskPopup } from "./timer/task-popup";
import { TimeGrid } from "./timer/time-grid";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const PIXELS_PER_HOUR = 48; // Réduit de 64 à 48
const EDITABLE_DAYS = 7; // Nombre de jours pendant lesquels une entrée est modifiable

// Composant WeekSelector (inchangé)
function WeekSelector({
  isOpen,
  onClose,
  onSelectWeek,
  currentWeekStart,
  buttonRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectWeek: (weekStart: Date) => void;
  currentWeekStart: Date;
  buttonRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks: Date[][] = [];

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const handleWeekClick = (week: Date[]) => {
      const weekStart = startOfWeek(week[0], { weekStartsOn: 1 });
      onSelectWeek(weekStart);
    };

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2 px-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-0.5 hover:bg-white/5 rounded transition"
          >
            <ChevronLeft size={14} className="text-white" />
          </button>
          <span className="text-white font-medium text-xs">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-0.5 hover:bg-white/5 rounded transition"
          >
            <ChevronRight size={14} className="text-white" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1 px-2">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <div
              key={day}
              className="text-center text-[9px] text-gray-400 py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="space-y-0.5 px-2">
          {weeks.map((week, weekIdx) => {
            const weekStartDate = week[0];
            const isCurrentWeek = isSameWeek(weekStartDate, currentWeekStart, {
              weekStartsOn: 1,
            });

            return (
              <div
                key={weekIdx}
                className="grid grid-cols-8 gap-0.5 hover:bg-white/5 rounded transition cursor-pointer group"
                onClick={() => handleWeekClick(week)}
              >
                <div
                  className={`
                  flex items-center justify-center text-[9px] py-0.5 rounded-l transition
                  ${isCurrentWeek ? "bg-purple-500 text-white" : "text-gray-500 bg-white/5"}
                  group-hover:bg-purple-500/30
                `}
                >
                  W{format(weekStartDate, "w")}
                </div>
                {week.map((day, dayIdx) => {
                  const isCurrentMonth =
                    day.getMonth() === currentMonth.getMonth();

                  return (
                    <div
                      key={dayIdx}
                      className={`
                        aspect-square flex items-center justify-center text-[10px] rounded transition
                        ${!isCurrentMonth ? "text-gray-600" : "text-white"}
                        ${isCurrentWeek ? "bg-purple-500/20" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={popupRef}
      className="absolute left-0 top-full mt-1 bg-[#1F2128] border border-[#313442] rounded-lg shadow-2xl z-50 overflow-hidden"
      style={{ width: "320px" }}
    >
      <div className="p-2" style={{ height: "280px" }}>
        {renderCalendar()}
      </div>
    </div>
  );
}

export function TimerSection() {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<
    "personal" | "shared" | ""
  >("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isWeekSelectorOpen, setIsWeekSelectorOpen] = useState(false);
  const weekSelectorButtonRef = useRef<HTMLDivElement>(null);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const taskSelectorRef = useRef<HTMLDivElement>(null);
  const [popupData, setPopupData] = useState<{
    isOpen: boolean;
    entry: Partial<TimeEntry> | null;
    mode: "create" | "edit";
  }>({
    isOpen: false,
    entry: null,
    mode: "create",
  });

  // Date limite pour les modifications (aujourd'hui - EDITABLE_DAYS, à minuit)
  const editableCutoff = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - EDITABLE_DAYS);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Queries
  const { data: activeTimer, error: activeTimerError } = useQuery({
    queryKey: ["activeTimer"],
    queryFn: timerService.getActive,
    refetchInterval: 1000,
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  const { data: personalTasks = [] } = useQuery({
    queryKey: ["personalTasks"],
    queryFn: () =>
      personalTaskService.getMyTasks({ status: TaskStatus.EN_COURS }),
  });

  const { data: sharedTasks = [] } = useQuery({
    queryKey: ["sharedTasks"],
    queryFn: () =>
      sharedTaskService.getMySharedTasks({ status: TaskStatus.EN_COURS }),
  });

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );

  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart],
  );

  const { data: entries = [] } = useQuery({
    queryKey: ["timeEntries", weekStart, weekEnd],
    queryFn: () =>
      timerService.getEntries(weekStart.toISOString(), weekEnd.toISOString()),
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
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) =>
      timerService.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: timerService.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      setPopupData({ isOpen: false, entry: null, mode: "create" });
      setEditingEntry(null);
    },
  });

  // Initialiser le timer actif
  useEffect(() => {
    if (activeTimer) {
      const taskId =
        activeTimer.personalTaskId || activeTimer.sharedTaskId || "";
      const taskType = activeTimer.personalTaskId
        ? "personal"
        : activeTimer.sharedTaskId
          ? "shared"
          : "";

      const cleanTaskId =
        typeof taskId === "string" ? taskId : (taskId as any)?._id || "";
      const cleanProjectId =
        typeof activeTimer.projectId === "string"
          ? activeTimer.projectId
          : (activeTimer.projectId as any)?._id || "";

      setSelectedTaskId(cleanTaskId);
      setSelectedTaskType(taskType);
      setSelectedProject(cleanProjectId);

      if (activeTimer.status === TimerStatus.RUNNING) {
        setIsRunning(true);
        setIsPaused(false);
        const elapsed = Math.floor(
          (Date.now() - new Date(activeTimer.startTime).getTime()) / 1000,
        );
        setSeconds(activeTimer.duration + elapsed);
      } else if (activeTimer.status === TimerStatus.PAUSED) {
        setIsRunning(false);
        setIsPaused(true);
        setSeconds(activeTimer.duration);
      }
    }
  }, [activeTimer]);

  // Fermer task selector au click outside
  useEffect(() => {
    if (!isTaskSelectorOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        taskSelectorRef.current &&
        !taskSelectorRef.current.contains(event.target as Node)
      ) {
        setIsTaskSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTaskSelectorOpen]);

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

  const handleSelectWeek = (newWeekStart: Date) => {
    const diff = differenceInCalendarWeeks(
      newWeekStart,
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      { weekStartsOn: 1 },
    );
    setWeekOffset(diff);
    setIsWeekSelectorOpen(false);
  };

  const handleTimerAction = () => {
    if (!isRunning && !isPaused) {
      if (!selectedTaskId) {
        alert("Veuillez sélectionner une tâche");
        return;
      }

      startMutation.mutate({
        projectId: selectedProject || undefined,
        personalTaskId:
          selectedTaskType === "personal" ? selectedTaskId : undefined,
        sharedTaskId:
          selectedTaskType === "shared" ? selectedTaskId : undefined,
      });
    } else if (isRunning) {
      pauseMutation.mutate();
    } else if (isPaused) {
      resumeMutation.mutate();
    }
  };

  const handleSelectTask = (
    taskId: string,
    taskType: "personal" | "shared",
  ) => {
    setSelectedTaskId(taskId);
    setSelectedTaskType(taskType);
    setIsTaskSelectorOpen(false);
  };

  const getSelectedTaskName = () => {
    if (!selectedTaskId) return "Sur quoi travaillez-vous ?";

    if (selectedTaskType === "personal") {
      const task = personalTasks.find((t: any) => t._id === selectedTaskId);
      return task?.title || "Tâche supprimée";
    } else if (selectedTaskType === "shared") {
      const task = sharedTasks.find((t: any) => t._id === selectedTaskId);
      return task?.title || "Tâche supprimée";
    }

    return "Tâche supprimée";
  };

  const getSelectedProjectName = () => {
    if (!selectedProject) return "";
    const project = projects.find((p) => p._id === selectedProject);
    return project?.name || "";
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
    return hours > 0
      ? `${hours}h${minutes.toString().padStart(2, "0")}m`
      : `${minutes}m`;
  };

  const weekDisplayText = useMemo(() => {
    return `${format(weekStart, "dd MMM", { locale: fr })} - ${format(weekEnd, "dd MMM yyyy", { locale: fr })} • W${format(weekStart, "w", { locale: fr })}`;
  }, [weekStart, weekEnd]);

  const weekTotalSeconds = useMemo(
    () => entries.reduce((acc, e) => acc + e.duration, 0),
    [entries],
  );

  const averageDailySeconds = useMemo(() => {
    const daysWithEntries = new Set(
      entries.map((e) => new Date(e.startTime).toDateString()),
    ).size;
    return daysWithEntries > 0 ? weekTotalSeconds / daysWithEntries : 0;
  }, [entries, weekTotalSeconds]);

  const gridEntries = useMemo(() => {
    const allEntries = [...entries];

    if (
      activeTimer &&
      (activeTimer.status === TimerStatus.RUNNING ||
        activeTimer.status === TimerStatus.PAUSED)
    ) {
      const now = new Date();
      let currentDuration = activeTimer.duration;

      if (activeTimer.status === TimerStatus.RUNNING) {
        const elapsed = Math.floor(
          (now.getTime() - new Date(activeTimer.startTime).getTime()) / 1000,
        );
        currentDuration += elapsed;
      }

      allEntries.push({
        ...activeTimer,
        duration: currentDuration,
        _id: "active-timer",
      } as any);
    }

    const processedEntries: any[] = [];
    let segmentCounter = 0;

    allEntries.forEach((entry) => {
      const entryStart = new Date(entry.startTime);
      const durationMs = entry.duration * 1000;
      const entryEnd = new Date(entryStart.getTime() + durationMs);

      if (
        entryStart.getDate() !== entryEnd.getDate() ||
        entryStart.getMonth() !== entryEnd.getMonth()
      ) {
        let currentStart = entryStart;
        let segmentIndex = 0;

        while (currentStart < entryEnd) {
          const dayEnd = new Date(currentStart);
          dayEnd.setHours(23, 59, 59, 999);

          const segmentEnd = entryEnd < dayEnd ? entryEnd : dayEnd;
          const segmentDuration = Math.floor(
            (segmentEnd.getTime() - currentStart.getTime()) / 1000,
          );

          if (segmentDuration > 0) {
            const dayIndex =
              currentStart.getDay() === 0 ? 6 : currentStart.getDay() - 1;
            const startHour =
              currentStart.getHours() + currentStart.getMinutes() / 60;
            const durationHours = segmentDuration / 3600;

            const projectName = entry.projectId
              ? typeof entry.projectId === "string"
                ? projects.find((p) => p._id === entry.projectId)?.name
                : (entry.projectId as any).name
              : "";

            const taskTitle = entry.personalTaskId
              ? typeof entry.personalTaskId === "string"
                ? personalTasks.find((t: any) => t._id === entry.personalTaskId)
                    ?.title
                : (entry.personalTaskId as any).title
              : entry.sharedTaskId
                ? typeof entry.sharedTaskId === "string"
                  ? sharedTasks.find((t: any) => t._id === entry.sharedTaskId)
                      ?.title
                  : (entry.sharedTaskId as any).title
                : "";

            processedEntries.push({
              ...entry,
              _id: `${entry._id}-segment-${segmentIndex}`,
              originalId: entry._id,
              dayIndex,
              startHour,
              durationHours,
              projectName,
              taskTitle,
              isActive: entry._id === "active-timer",
              duration: segmentDuration,
            });

            segmentIndex++;
          }

          currentStart = addDays(currentStart, 1);
          currentStart.setHours(0, 0, 0, 0);
        }
      } else {
        const dayIndex =
          entryStart.getDay() === 0 ? 6 : entryStart.getDay() - 1;
        const startHour = entryStart.getHours() + entryStart.getMinutes() / 60;
        const durationHours = entry.duration / 3600;

        const projectName = entry.projectId
          ? typeof entry.projectId === "string"
            ? projects.find((p) => p._id === entry.projectId)?.name
            : (entry.projectId as any).name
          : "";

        const taskTitle = entry.personalTaskId
          ? typeof entry.personalTaskId === "string"
            ? personalTasks.find((t: any) => t._id === entry.personalTaskId)
                ?.title
            : (entry.personalTaskId as any).title
          : entry.sharedTaskId
            ? typeof entry.sharedTaskId === "string"
              ? sharedTasks.find((t: any) => t._id === entry.sharedTaskId)
                  ?.title
              : (entry.sharedTaskId as any).title
            : "";

        processedEntries.push({
          ...entry,
          originalId: entry._id,
          dayIndex,
          startHour,
          durationHours,
          projectName,
          taskTitle,
          isActive: entry._id === "active-timer",
        });
      }
    });

    return processedEntries;
  }, [entries, activeTimer, projects, personalTasks, sharedTasks]);

  const currentPosition = useMemo(() => {
    const now = new Date();
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const hourPosition = now.getHours() + now.getMinutes() / 60;
    return { dayIndex, hourPosition };
  }, []);

  const handleEntryClick = (entry: any) => {
    if (entry.isActive) return;
    const originalEntry = entries.find(
      (e) => e._id === (entry.originalId || entry._id),
    );
    if (originalEntry) {
      setPopupData({
        isOpen: true,
        entry: originalEntry,
        mode: "edit",
      });
      setEditingEntry(originalEntry);
    }
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !editingEntry._id) return;

    const updateData: any = {
      projectId: editingEntry.projectId,
      personalTaskId: editingEntry.personalTaskId,
      sharedTaskId: editingEntry.sharedTaskId,
    };

    if (
      editingEntry.status === TimerStatus.STOPPED &&
      editingEntry.startTime &&
      editingEntry.endTime
    ) {
      updateData.startTime = editingEntry.startTime;
      updateData.endTime = editingEntry.endTime;
    }

    updateMutation.mutate({
      id: editingEntry._id,
      data: updateData,
    });
  };

  const handleDeleteEntry = () => {
    if (!editingEntry || !editingEntry._id) return;

    if (confirm("Supprimer cette entrée ?")) {
      deleteMutation.mutate(editingEntry._id);
    }
  };

  const handleGridClick = (dayIndex: number, hour: number) => {
    const clickedDate = new Date(weekStart);
    clickedDate.setDate(clickedDate.getDate() + dayIndex);
    clickedDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

    setPopupData({
      isOpen: true,
      entry: {
        startTime: clickedDate.toISOString(),
        duration: 900,
        endTime: new Date(clickedDate.getTime() + 900000).toISOString(),
        personalTaskId:
          selectedTaskId && selectedTaskType === "personal"
            ? selectedTaskId
            : undefined,
        sharedTaskId:
          selectedTaskId && selectedTaskType === "shared"
            ? selectedTaskId
            : undefined,
        projectId: selectedProject || undefined,
      },
      mode: "create",
    });
  };

  const handlePopupSave = async (data: Partial<TimeEntry>) => {
    try {
      if (popupData.mode === "create") {
        await timerService.createEntry(data);
      } else if (popupData.entry?._id) {
        await updateMutation.mutateAsync({
          id: popupData.entry._id,
          data,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      await queryClient.invalidateQueries({ queryKey: ["activeTimer"] });

      await queryClient.refetchQueries({
        queryKey: ["timeEntries", weekStart, weekEnd],
      });

      setPopupData({ isOpen: false, entry: null, mode: "create" });
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        details: error.response?.data,
        fullError: error,
      });

      alert(
        `Erreur: ${error.response?.data?.message || "Impossible de sauvegarder"}`,
      );
    }
  };

  const handleTaskUpdate = async (
    entryId: string,
    startHour: number,
    durationHours: number,
  ) => {
    const entry = entries.find((e) => e._id === entryId);
    if (!entry) return;

    const startDate = new Date(entry.startTime);
    startDate.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);

    const endDate = new Date(startDate.getTime() + durationHours * 3600000);

    const extractId = (value: any): string | undefined => {
      if (!value) return undefined;
      if (typeof value === "string") return value;
      if (typeof value === "object" && value._id) return value._id;
      return undefined;
    };

    const updateData: any = {
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: Math.floor(durationHours * 3600),
    };

    const personalTaskId = extractId(entry.personalTaskId);
    const sharedTaskId = extractId(entry.sharedTaskId);
    const projectId = extractId(entry.projectId);

    if (personalTaskId) updateData.personalTaskId = personalTaskId;
    if (sharedTaskId) updateData.sharedTaskId = sharedTaskId;
    if (projectId) updateData.projectId = projectId;

    try {
      await updateMutation.mutateAsync({
        id: entryId,
        data: updateData,
      });
    } catch (error: any) {
      console.error("Resize - Erreur backend:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        details: error.response?.data,
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-transparent -mb-8 -mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* TOP BAR */}
      <div className="border-b px-4 py-2 flex items-center gap-3 bg-transparent z-30 flex-shrink-0">
        <div className="flex-1 relative" ref={taskSelectorRef}>
          <div
            onClick={() =>
              !isRunning &&
              !isPaused &&
              setIsTaskSelectorOpen(!isTaskSelectorOpen)
            }
            className={`text-base font-medium outline-none text-white bg-transparent cursor-pointer ${isRunning || isPaused ? "opacity-50" : "hover:text-purple-400"}`}
          >
            {getSelectedTaskName()}
          </div>

          {/* Task Selector Popup */}
          {isTaskSelectorOpen && (
            <div className="absolute top-full left-0 mt-1 bg-[#1F2128] border border-[#313442] rounded-lg shadow-2xl z-50 w-80 max-h-80 overflow-y-auto">
              <div className="p-1">
                {personalTasks.length > 0 && (
                  <>
                    <div className="text-gray-400 text-[10px] px-2 py-1 font-semibold">
                      TÂCHES PERSONNELLES
                    </div>
                    {personalTasks.map((task: any) => (
                      <button
                        key={task._id}
                        onClick={() => handleSelectTask(task._id, "personal")}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-white text-xs"
                      >
                        {task.title}
                      </button>
                    ))}
                  </>
                )}

                {sharedTasks.length > 0 && (
                  <>
                    <div className="text-gray-400 text-[10px] px-2 py-1 font-semibold mt-1">
                      TÂCHES PARTAGÉES
                    </div>
                    {sharedTasks.map((task: any) => (
                      <button
                        key={task._id}
                        onClick={() => handleSelectTask(task._id, "shared")}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-white text-xs"
                      >
                        {task.title}
                      </button>
                    ))}
                  </>
                )}

                {personalTasks.length === 0 && sharedTasks.length === 0 && (
                  <div className="px-2 py-3 text-center text-gray-400 text-xs">
                    Aucune tâche en cours
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {getSelectedProjectName() && (
          <div className="text-xs text-purple-400 px-2 py-0.5 bg-purple-500/10 rounded">
            {getSelectedProjectName()}
          </div>
        )}

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border rounded px-2 py-0.5 text-xs text-white bg-[#0F0F12] w-32"
          disabled={isRunning || isPaused}
        >
          <option value="">Sans projet</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <span className="font-mono text-base w-[100px] text-center text-white">
          {formatTime(seconds)}
        </span>

        <button
          onClick={handleTimerAction}
          className={`px-3 py-1 rounded text-white ${isPaused ? "bg-blue-500" : isRunning ? "bg-yellow-500" : "bg-green-500"}`}
        >
          {isPaused ? (
            <Play size={14} />
          ) : isRunning ? (
            <Pause size={14} />
          ) : (
            <Play size={14} />
          )}
        </button>

        {(isRunning || isPaused) && (
          <button
            onClick={handleStop}
            className="px-3 py-1 rounded bg-red-500 text-white"
          >
            <Square size={14} />
          </button>
        )}
      </div>

      {/* WEEK HEADER */}
      <div className="border-b px-4 py-1.5 flex items-center justify-between bg-transparent text-white z-20 flex-shrink-0">
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-0.5 hover:bg-white/5 rounded"
          >
            <ChevronLeft size={16} />
          </button>
          <div
            ref={weekSelectorButtonRef}
            onClick={() => setIsWeekSelectorOpen(!isWeekSelectorOpen)}
            className="flex items-center gap-1 bg-[#0F0F12] px-3 py-1 rounded cursor-pointer hover:bg-[#1a1a1f] transition"
          >
            <Calendar className="text-purple-400" size={14} />
            <span className="text-white text-xs font-medium">
              {weekDisplayText}
            </span>
          </div>

          {isWeekSelectorOpen && (
            <WeekSelector
              isOpen={isWeekSelectorOpen}
              onClose={() => setIsWeekSelectorOpen(false)}
              onSelectWeek={handleSelectWeek}
              currentWeekStart={weekStart}
              buttonRef={weekSelectorButtonRef}
            />
          )}

          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-0.5 hover:bg-white/5 rounded"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex gap-6">
          <span className="text-base font-medium font-mono">
            Total : {formatTime(weekTotalSeconds)}
          </span>
          <span className="text-base font-medium font-mono">
            Moyenne journalière : {formatTime(Math.floor(averageDailySeconds))}
          </span>
        </div>
      </div>

      {/* DAYS HEADER */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-transparent text-white z-10 flex-shrink-0">
        <div />
        {DAYS.map((day, i) => {
          const dayTotal = gridEntries
            .filter((e) => e.dayIndex === i)
            .reduce((sum, e) => sum + e.duration, 0);
          return (
            <div key={day} className="text-center py-1.5 font-medium text-sm">
              {day}
              <p className="text-xs text-gray-400 font-mono">
                {formatTime(dayTotal)}
              </p>
            </div>
          );
        })}
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-auto">
        <div className="relative min-w-[700px]">
          <TimeGrid
            onCellClick={handleGridClick}
            pixelsPerHour={PIXELS_PER_HOUR}
            editableCutoff={editableCutoff}
            weekStart={weekStart}
          />

          {/* Marqueur de position actuelle */}
          <div
            className="absolute w-full pointer-events-none z-10"
            style={{
              left: `calc(60px + ${currentPosition.dayIndex} * (100% - 60px) / 7)`,
              top: currentPosition.hourPosition * PIXELS_PER_HOUR,
              width: `calc((100% - 60px) / 7)`,
            }}
          >
            <div className="w-full h-0.5 bg-white relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full -ml-1"></div>
            </div>
          </div>

          {gridEntries.map((entry, index) => (
            <TaskBlock
              key={entry._id || index}
              entry={entry}
              dayIndex={entry.dayIndex}
              startHour={entry.startHour}
              durationHours={entry.durationHours}
              pixelsPerHour={PIXELS_PER_HOUR}
              isActive={entry.isActive}
              onClick={() => handleEntryClick(entry)}
              onUpdate={(startHour, durationHours) =>
                handleTaskUpdate(
                  entry.originalId || entry._id,
                  startHour,
                  durationHours,
                )
              }
              editableCutoff={editableCutoff}
            />
          ))}
        </div>
      </div>

      <TaskPopup
        isOpen={popupData.isOpen}
        onClose={() => {
          setPopupData({ isOpen: false, entry: null, mode: "create" });
          setEditingEntry(null);
        }}
        entry={popupData.entry}
        projects={projects}
        personalTasks={personalTasks}
        sharedTasks={sharedTasks}
        onSave={handlePopupSave}
        onDelete={
          popupData.mode === "edit" && popupData.entry?._id
            ? () => handleDeleteEntry()
            : undefined
        }
        mode={popupData.mode}
        isEditable={
          popupData.mode === "edit" && popupData.entry
            ? !!popupData.entry.startTime && new Date(popupData.entry.startTime) >= editableCutoff
            : true
        }
      />
    </div>
  );
}