"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  List,
  LayoutGrid,
  Search,
  Calendar,
  Plus,
  Archive,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  CollisionDetection,
  UniqueIdentifier,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  personalTaskService,
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskDto,
  CreateSubtaskDto,
} from "@/lib/task-service";
import { projectService, Project } from "@/lib/project-service";
import { usersService } from "@/lib/users-service";
import KanbanColumn from "./kanban/KanbanColumn";
import TaskCard from "./kanban/TaskCard";
import QuickTaskForm from "./kanban/QuickTaskForm";
import AddSubtaskModal from "./kanban/AddSubtaskModal";
import TaskDetailModal from "./kanban/TaskDetailModal";
import ProjectFilter from "./kanban/ProjectFilter";
import PriorityFilter from "./kanban/PriorityFilter";
import SubtaskDetailModal from "./kanban/SubtaskDetailModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Colonnes Kanban ──────────────────────────────────────────────────────────
const COLUMNS = [
  {
    id: TaskStatus.A_FAIRE,
    title: "À FAIRE",
    color: "border-[#313442]",
    bg: "bg-gray-900/30",
  },
  {
    id: TaskStatus.EN_COURS,
    title: "EN COURS",
    color: "border-[#313442]",
    bg: "bg-[#6C4EA821]",
  },
  {
    id: TaskStatus.TERMINEE,
    title: "TERMINÉ",
    color: "border-[#313442]",
    bg: "bg-[#71D29121]",
  },
  {
    id: TaskStatus.ANNULEE,
    title: "ANNULÉ",
    color: "border-[#313442]",
    bg: "bg-red-900/20",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getColumnIdFromDroppable(id: UniqueIdentifier): TaskStatus | null {
  const str = String(id);
  if (str.startsWith("col-")) {
    return str.replace("col-", "") as TaskStatus;
  }
  return null;
}

export function TachesSection() {
  const [userData, setUserData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "all">("all");
  const [showArchived, setShowArchived] = useState(false);

  const [columnTaskIds, setColumnTaskIds] = useState<Record<string, string[]>>({
    [TaskStatus.A_FAIRE]: [],
    [TaskStatus.EN_COURS]: [],
    [TaskStatus.TERMINEE]: [],
    [TaskStatus.ANNULEE]: [],
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [loadingSubtasksMap, setLoadingSubtasksMap] = useState<Record<string, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("expanded_tasks_personal");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState<{ taskId: string; isShared: boolean } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<TaskStatus | undefined>(undefined);

  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const queryClient = useQueryClient();

  // ─── Sensors ────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ─── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) setUserData(JSON.parse(storedUserData));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, usersData] = await Promise.all([
          projectService.getAll(),
          usersService.searchUsers({ role: "collaborateur" }),
        ]);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Erreur chargement données:", error);
      }
    };
    loadData();
  }, []);

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["personalTasks", showArchived],
    queryFn: () => personalTaskService.getMyTasks({ includeArchived: showArchived }),
  });

  // ─── FIX: Synchroniser columnTaskIds sans boucle infinie ────────────────────
  // On dérive une string stable qui ne change que si les tâches ou leurs statuts changent réellement.
  // Utiliser `tasks` directement comme dépendance provoque une boucle infinie car
  // useQuery retourne un nouveau tableau à chaque render (nouvelle référence).
  const taskStatuses = tasks.map((t) => `${t._id}:${t.status}`).join(",");

  useEffect(() => {
    const newMap: Record<string, string[]> = {
      [TaskStatus.A_FAIRE]: [],
      [TaskStatus.EN_COURS]: [],
      [TaskStatus.TERMINEE]: [],
      [TaskStatus.ANNULEE]: [],
    };
    tasks.forEach((task) => {
      if (newMap[task.status] !== undefined) {
        newMap[task.status].push(task._id);
      }
    });
    setColumnTaskIds(newMap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskStatuses]); // ← string primitive : stable, pas de boucle infinie

  // Sauvegarder l'état des tâches dépliées
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("expanded_tasks_personal", JSON.stringify(expandedTasks));
    }
  }, [expandedTasks]);

  // ─── Archive mutation ────────────────────────────────────────────────────────
  const archiveCompletedMutation = useMutation({
    mutationFn: personalTaskService.archiveCompletedTasks,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ["personalTasks"] });
      alert(data.message || "Tâches archivées avec succès");
    },
  });

  // ─── Subtasks ────────────────────────────────────────────────────────────────
  const loadSubtasks = async (taskId: string) => {
    setLoadingSubtasksMap((prev) => ({ ...prev, [taskId]: true }));
    try {
      const subtasks = await personalTaskService.getSubtasks(taskId);
      setSubtasksMap((prev) => ({ ...prev, [taskId]: subtasks }));
    } catch (error) {
      console.error("Erreur chargement sous-tâches:", error);
    } finally {
      setLoadingSubtasksMap((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleToggleSubtasks = (taskId: string, show: boolean) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: show }));
    if (show && !subtasksMap[taskId] && !loadingSubtasksMap[taskId]) {
      loadSubtasks(taskId);
    }
  };

  // ─── Filtres ─────────────────────────────────────────────────────────────────
  const filteredTasks = tasks.filter((task) => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedProject !== "all" && task.project_id?._id !== selectedProject) return false;
    if (selectedPriority !== "all" && task.priority !== selectedPriority) return false;
    return true;
  });

  // ─── CollisionDetection personnalisée ───────────────────────────────────────
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      const { active, droppableContainers } = args;

      const columnCollisions = pointerWithin({
        ...args,
        droppableContainers: droppableContainers.filter((c) =>
          String(c.id).startsWith("col-")
        ),
      });

      if (columnCollisions.length > 0) {
        const columnId = getColumnIdFromDroppable(columnCollisions[0].id);
        if (columnId) {
          const tasksInColumn = droppableContainers.filter(
            (c) => !String(c.id).startsWith("col-") && columnTaskIds[columnId]?.includes(String(c.id))
          );

          if (tasksInColumn.length > 0) {
            const closestTask = closestCenter({
              ...args,
              droppableContainers: tasksInColumn,
            });
            if (closestTask.length > 0) {
              lastOverId.current = closestTask[0].id;
              return closestTask;
            }
          }

          lastOverId.current = columnCollisions[0].id;
          return columnCollisions;
        }
      }

      const allCollisions = closestCenter(args);
      if (allCollisions.length > 0) {
        lastOverId.current = allCollisions[0].id;
      }
      return allCollisions;
    },
    [columnTaskIds]
  );

  // ─── Drag Start ──────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t._id === event.active.id);
      setActiveTask(task || null);
    },
    [tasks]
  );

  // ─── Drag Over ───────────────────────────────────────────────────────────────
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      let sourceColumnId: string | null = null;
      let targetColumnId: string | null = null;

      for (const [colId, ids] of Object.entries(columnTaskIds)) {
        if (ids.includes(activeId)) {
          sourceColumnId = colId;
          break;
        }
      }

      if (overId.startsWith("col-")) {
        targetColumnId = overId.replace("col-", "");
      } else {
        for (const [colId, ids] of Object.entries(columnTaskIds)) {
          if (ids.includes(overId)) {
            targetColumnId = colId;
            break;
          }
        }
      }

      if (!sourceColumnId || !targetColumnId) return;
      if (sourceColumnId === targetColumnId) return;

      setColumnTaskIds((prev) => {
        const sourceIds = [...(prev[sourceColumnId!] || [])];
        const targetIds = [...(prev[targetColumnId!] || [])];

        const activeIndex = sourceIds.indexOf(activeId);
        if (activeIndex === -1) return prev;

        sourceIds.splice(activeIndex, 1);

        if (!overId.startsWith("col-")) {
          const overIndex = targetIds.indexOf(overId);
          if (overIndex >= 0) {
            targetIds.splice(overIndex, 0, activeId);
          } else {
            targetIds.push(activeId);
          }
        } else {
          targetIds.push(activeId);
        }

        recentlyMovedToNewContainer.current = true;

        return {
          ...prev,
          [sourceColumnId!]: sourceIds,
          [targetColumnId!]: targetIds,
        };
      });
    },
    [columnTaskIds]
  );

  // ─── Drag End ────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      let targetColumnId: string | null = null;

      if (overId.startsWith("col-")) {
        targetColumnId = overId.replace("col-", "");
      } else {
        for (const [colId, ids] of Object.entries(columnTaskIds)) {
          if (ids.includes(overId)) {
            targetColumnId = colId;
            break;
          }
        }
      }

      let sourceColumnId: string | null = null;
      for (const [colId, ids] of Object.entries(columnTaskIds)) {
        if (ids.includes(activeId)) {
          sourceColumnId = colId;
          break;
        }
      }

      if (!targetColumnId || !sourceColumnId) return;

      if (sourceColumnId === targetColumnId) {
        const colIds = [...columnTaskIds[sourceColumnId]];
        const oldIndex = colIds.indexOf(activeId);
        const newIndex = colIds.indexOf(overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newIds = arrayMove(colIds, oldIndex, newIndex);
          setColumnTaskIds((prev) => ({ ...prev, [sourceColumnId!]: newIds }));
        }
        return;
      }

      const newStatus = targetColumnId as TaskStatus;

      queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) =>
        old?.map((task) =>
          task._id === activeId ? { ...task, status: newStatus } : task
        )
      );

      try {
        await personalTaskService.update(activeId, { status: newStatus });
      } catch (error) {
        console.error("Erreur mise à jour statut:", error);
        queryClient.invalidateQueries({ queryKey: ["personalTasks"] });
      }
    },
    [columnTaskIds, queryClient, showArchived]
  );

  // ─── CRUD handlers ────────────────────────────────────────────────────────────
  const handleCreateTask = async (data: CreateTaskDto) => {
    try {
      const newTask = await personalTaskService.create(data);
      queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) => [
        ...(old || []),
        newTask,
      ]);
      setShowTaskForm(false);
    } catch (error) {
      console.error("Erreur création tâche:", error);
    }
  };

  const handleCreateSubtask = async (parentTaskId: string, data: CreateSubtaskDto) => {
    try {
      const newSubtask = await personalTaskService.createSubtask(parentTaskId, data);
      setSubtasksMap((prev) => ({
        ...prev,
        [parentTaskId]: [...(prev[parentTaskId] || []), newSubtask],
      }));
      queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) =>
        old?.map((task) => {
          if (task._id === parentTaskId) {
            return { ...task, sub_tasks: [...task.sub_tasks, newSubtask._id] };
          }
          return task;
        })
      );
      setShowSubtaskForm(null);
    } catch (error) {
      console.error("Erreur création sous-tâche:", error);
    }
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      const updatedTask = await personalTaskService.update(taskId, data);

      let isSubtask = false;
      let parentId: string | undefined;

      for (const pid in subtasksMap) {
        const subtask = subtasksMap[pid].find((st) => st._id === taskId);
        if (subtask) {
          isSubtask = true;
          parentId = pid;
          break;
        }
      }

      if (isSubtask && parentId) {
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId!]: (prev[parentId!] || []).map((st) =>
            st._id === taskId ? { ...st, ...updatedTask } : st
          ),
        }));
        setSelectedSubtask(null);
      } else {
        queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) =>
          old?.map((task) => (task._id === taskId ? { ...task, ...updatedTask } : task))
        );
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Erreur mise à jour tâche:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;

    try {
      const taskToDelete =
        tasks.find((t) => t._id === taskId) ||
        Object.values(subtasksMap).flat().find((st) => st._id === taskId);
      if (!taskToDelete) return;

      const isSubtask = taskToDelete.parentTaskId != null;
      await personalTaskService.delete(taskId);

      if (isSubtask) {
        const parentId = taskToDelete.parentTaskId as string;
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((st) => st._id !== taskId),
        }));
        queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) =>
          old?.map((task) => {
            if (task._id === parentId) {
              return { ...task, sub_tasks: task.sub_tasks.filter((id) => id !== taskId) };
            }
            return task;
          })
        );
        setSelectedSubtask(null);
      } else {
        queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) =>
          old?.filter((task) => task._id !== taskId)
        );
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Erreur suppression tâche:", error);
    }
  };

  const handleEditTask = (taskId: string) => {
    for (const parentId in subtasksMap) {
      const subtask = subtasksMap[parentId].find((st) => st._id === taskId);
      if (subtask) {
        setSelectedSubtask(subtask);
        return;
      }
    }
    const parentTask = tasks.find((t) => t._id === taskId);
    if (parentTask) setSelectedTask(parentTask);
  };

  const handleAddSubtask = (taskId: string) => {
    setShowSubtaskForm({ taskId, isShared: false });
  };

  // ─── Computed: tâches filtrées par colonne ───────────────────────────────────
  const getColumnTasks = (columnId: string): Task[] => {
    const orderedIds = columnTaskIds[columnId] || [];
    return orderedIds
      .map((id) => filteredTasks.find((t) => t._id === id))
      .filter(Boolean) as Task[];
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] text-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement des tâches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10] text-gray-100 -mt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Espace Personnel</h1>
          <p className="text-gray-400">Gère tes tâches et marque ton temps</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => archiveCompletedMutation.mutate()}
            disabled={archiveCompletedMutation.isPending}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-xs disabled:opacity-50"
          >
            <Archive size={16} />
            {archiveCompletedMutation.isPending ? "Archivage..." : "Nettoyer les terminées"}
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-lg transition text-xs ${
              showArchived ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {showArchived ? "Masquer archivées" : "Voir archivées"}
          </button>
          <button
            onClick={() => {
              setDefaultStatusForNewTask(undefined);
              setShowTaskForm(true);
            }}
            className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-xs"
          >
            <Plus size={16} />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Barre de contrôle */}
      <div className="mb-6 p-2 bg-[#1a1a1d] rounded-xl border border-gray-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                viewMode === "kanban" ? "bg-[#6C4EA8] text-white" : "bg-[#2a2a2d] text-gray-300"
              }`}
            >
              <LayoutGrid size={16} />
              Tableau
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                viewMode === "list" ? "bg-[#6C4EA8] text-white" : "bg-[#2a2a2d] text-gray-300"
              }`}
            >
              <List size={16} />
              Liste
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 md:w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#2a2a2d] border border-gray-700 rounded-lg w-full focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <ProjectFilter
                projects={projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />
              <PriorityFilter
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Kanban ── */}
      {viewMode === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex gap-3 min-w-max">
              {COLUMNS.map((column) => {
                const colTasks = getColumnTasks(column.id);
                return (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    color={column.color}
                    bg={column.bg}
                    count={colTasks.length}
                    taskIds={colTasks.map((t) => t._id)}
                    onAddTask={(status) => {
                      setDefaultStatusForNewTask(status as TaskStatus);
                      setShowTaskForm(true);
                    }}
                  >
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        subtasks={subtasksMap[task._id] || []}
                        loadingSubtasks={loadingSubtasksMap[task._id] || false}
                        isSubtasksExpanded={expandedTasks[task._id] || false}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onAddSubtask={handleAddSubtask}
                        onToggleSubtasks={handleToggleSubtasks}
                      />
                    ))}
                  </KanbanColumn>
                );
              })}
            </div>
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeTask ? (
              <div className="rotate-2 opacity-90 w-[230px] shadow-2xl">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onAddSubtask={() => {}}
                  onToggleSubtasks={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Vue Liste ── */}
      {viewMode === "list" && (
        <div className="bg-[#1a1a1d] rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-[#2a2a2d]">
                <tr>
                  <th className="text-left p-3 text-xs">Tâche</th>
                  <th className="text-left p-3 text-xs">Priorité</th>
                  <th className="text-left p-3 text-xs">Projet</th>
                  <th className="text-left p-3 text-xs">Deadline</th>
                  <th className="text-left p-3 text-xs">Statut</th>
                  <th className="text-left p-3 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="border-t border-gray-800 hover:bg-gray-900/50">
                    <td className="p-3">
                      <div className="font-medium text-xs">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">{task.description}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="p-3">
                      {task.project_id ? (
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                          {task.project_id.name}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {task.end_date ? (
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={12} />
                          {new Date(task.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditTask(task._id)} className="p-1 hover:bg-gray-700 rounded text-xs">
                          Modifier
                        </button>
                        <button onClick={() => handleDeleteTask(task._id)} className="p-1 hover:bg-red-900/30 rounded text-red-400 text-xs">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showTaskForm && (
        <QuickTaskForm
          projects={projects}
          users={users}
          currentUserId={userData?._id}
          isShared={false}
          defaultStatus={defaultStatusForNewTask}
          defaultColumnStatus={defaultStatusForNewTask}
          onSubmit={handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false);
            setDefaultStatusForNewTask(undefined);
          }}
        />
      )}
      {showSubtaskForm && (
        <AddSubtaskModal
          isShared={showSubtaskForm.isShared}
          assignees={users}
          onSubmit={(data) => handleCreateSubtask(showSubtaskForm.taskId, data)}
          onCancel={() => setShowSubtaskForm(null)}
        />
      )}
      {selectedSubtask && (
        <SubtaskDetailModal
          task={selectedSubtask}
          users={users}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onClose={() => setSelectedSubtask(null)}
          isShared={false}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projects={projects}
          users={users}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onClose={() => setSelectedTask(null)}
          isPersonal={true}
        />
      )}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors: Record<TaskPriority, string> = {
    [TaskPriority.URGENTE]: "bg-red-500/20 text-red-300 border-red-500",
    [TaskPriority.ELEVEE]: "bg-orange-500/20 text-orange-300 border-orange-500",
    [TaskPriority.NORMALE]: "bg-blue-500/20 text-blue-300 border-blue-500",
    [TaskPriority.BASSE]: "bg-gray-500/20 text-gray-300 border-gray-500",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${colors[priority]}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const colors: Record<TaskStatus, string> = {
    [TaskStatus.A_FAIRE]: "bg-gray-500/20 text-gray-300",
    [TaskStatus.EN_COURS]: "bg-purple-500/20 text-purple-300",
    [TaskStatus.TERMINEE]: "bg-green-500/20 text-green-300",
    [TaskStatus.ANNULEE]: "bg-red-500/20 text-red-300",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
      {status}
    </span>
  );
}