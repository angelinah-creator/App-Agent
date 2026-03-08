"use client";

import { useState, useEffect, useCallback } from "react";
import {
  List,
  LayoutGrid,
  Search,
  Users,
  Calendar,
  Flag,
  Plus,
  Archive,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
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

export function TachesSection() {
  const [userData, setUserData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<
    TaskPriority | "all"
  >("all");
  const [showArchived, setShowArchived] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [loadingSubtasksMap, setLoadingSubtasksMap] = useState<
    Record<string, boolean>
  >({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("expanded_tasks_personal");
        return saved ? JSON.parse(saved) : {};
      }
      return {};
    },
  );

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState<{
    taskId: string;
    isShared: boolean;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<
    TaskStatus | undefined
  >(undefined);

  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Charger les données utilisateur
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // Charger les projets et utilisateurs une fois
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
        console.error("Erreur chargement données de base:", error);
      }
    };
    loadData();
  }, []);

  // Requête des tâches avec prise en compte du filtre d'archivage
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["personalTasks", showArchived],
    queryFn: () =>
      personalTaskService.getMyTasks({
        includeArchived: showArchived,
      }),
  });

  // Mutation pour l'archivage automatique
  const archiveCompletedMutation = useMutation({
    mutationFn: personalTaskService.archiveCompletedTasks,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ["personalTasks"] });
      alert(data.message || "Tâches archivées avec succès");
    },
    onError: (error) => {
      console.error("Erreur archivage:", error);
      alert("Erreur lors de l'archivage des tâches terminées");
    },
  });

  // Sauvegarder l'état des tâches déployées
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "expanded_tasks_personal",
        JSON.stringify(expandedTasks),
      );
    }
  }, [expandedTasks]);

  // Charger les sous-tâches pour une tâche spécifique
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

  // Gérer le développement/réduction des sous-tâches
  const handleToggleSubtasks = (taskId: string, show: boolean) => {
    const newExpandedTasks = { ...expandedTasks, [taskId]: show };
    setExpandedTasks(newExpandedTasks);

    // Si on développe et que les sous-tâches ne sont pas chargées, les charger
    if (show && !subtasksMap[taskId] && !loadingSubtasksMap[taskId]) {
      loadSubtasks(taskId);
    }
  };

  // Filtrer les tâches selon la recherche, projet et priorité
  const filteredTasks = tasks.filter((task) => {
    if (
      searchTerm &&
      !task.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (selectedProject !== "all" && task.project_id?._id !== selectedProject) {
      return false;
    }
    if (selectedPriority !== "all" && task.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  // Gestion drag & drop
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
      const task = tasks.find((t) => t._id === event.active.id);
      setActiveTask(task || null);
    },
    [tasks],
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    try {
      // Mettre à jour le statut dans l'UI immédiatement
      queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) =>
        old?.map((task) =>
          task._id === taskId ? { ...task, status: newStatus } : task,
        ),
      );

      // Si c'est une tâche parente, mettre à jour aussi les sous-tâches
      if (subtasksMap[taskId] && subtasksMap[taskId].length > 0) {
        setSubtasksMap((prev) => ({
          ...prev,
          [taskId]: prev[taskId].map((subtask) => ({
            ...subtask,
            status: newStatus,
          })),
        }));
      }

      // Envoyer la mise à jour au backend
      await personalTaskService.update(taskId, { status: newStatus });
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      queryClient.invalidateQueries({ queryKey: ["personalTasks"] });
    } finally {
      setActiveId(null);
      setActiveTask(null);
    }
  };

  // Créer une tâche
  const handleCreateTask = async (data: CreateTaskDto) => {
    try {
      const newTask = await personalTaskService.create(data);
      queryClient.setQueryData<Task[]>(
        ["personalTasks", showArchived],
        (old) => [...(old || []), newTask],
      );
      setShowTaskForm(false);
    } catch (error) {
      console.error("Erreur création tâche:", error);
    }
  };

  // Créer une sous-tâche
  const handleCreateSubtask = async (
    parentTaskId: string,
    data: CreateSubtaskDto,
  ) => {
    try {
      const newSubtask = await personalTaskService.createSubtask(
        parentTaskId,
        data,
      );

      setSubtasksMap((prev) => ({
        ...prev,
        [parentTaskId]: [...(prev[parentTaskId] || []), newSubtask],
      }));

      queryClient.setQueryData<Task[]>(["personalTasks", showArchived], (old) =>
        old?.map((task) => {
          if (task._id === parentTaskId) {
            return {
              ...task,
              sub_tasks: [...task.sub_tasks, newSubtask._id],
            };
          }
          return task;
        }),
      );

      setShowSubtaskForm(null);
    } catch (error) {
      console.error("Erreur création sous-tâche:", error);
    }
  };

  // Mettre à jour une tâche
  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      const updatedTask = await personalTaskService.update(taskId, data);

      // Chercher si c'est une sous-tâche
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
          [parentId]: (prev[parentId] || []).map((st) =>
            st._id === taskId ? { ...st, ...updatedTask } : st,
          ),
        }));
        setSelectedSubtask(null);
      } else {
        queryClient.setQueryData<Task[]>(
          ["personalTasks", showArchived],
          (old) =>
            old?.map((task) =>
              task._id === taskId ? { ...task, ...updatedTask } : task,
            ),
        );
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Erreur mise à jour tâche:", error);
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;

    try {
      const taskToDelete =
        tasks.find((t) => t._id === taskId) ||
        Object.values(subtasksMap)
          .flat()
          .find((st) => st._id === taskId);

      if (!taskToDelete) return;

      const isSubtask = taskToDelete.parentTaskId != null;

      await personalTaskService.delete(taskId);

      if (isSubtask) {
        const parentId = taskToDelete.parentTaskId as string;
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((st) => st._id !== taskId),
        }));

        queryClient.setQueryData<Task[]>(
          ["personalTasks", showArchived],
          (old) =>
            old?.map((task) => {
              if (task._id === parentId) {
                return {
                  ...task,
                  sub_tasks: task.sub_tasks.filter((id) => id !== taskId),
                };
              }
              return task;
            }),
        );

        setSelectedSubtask(null);
      } else {
        queryClient.setQueryData<Task[]>(
          ["personalTasks", showArchived],
          (old) => old?.filter((task) => task._id !== taskId),
        );
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Erreur suppression tâche:", error);
    }
  };

  // Gérer l'édition
  const handleEditTask = (taskId: string) => {
    // Chercher dans les sous-tâches
    for (const parentId in subtasksMap) {
      const subtask = subtasksMap[parentId].find((st) => st._id === taskId);
      if (subtask) {
        setSelectedSubtask(subtask);
        return;
      }
    }

    // Chercher dans les tâches parentes
    const parentTask = tasks.find((t) => t._id === taskId);
    if (parentTask) {
      setSelectedTask(parentTask);
      return;
    }
  };

  // Gérer l'ajout d'une sous-tâche
  const handleAddSubtask = (taskId: string) => {
    setShowSubtaskForm({
      taskId,
      isShared: false,
    });
  };

  // Colonnes Kanban
  const columns = [
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
          {/* Bouton d'archivage */}
          <button
            onClick={() => archiveCompletedMutation.mutate()}
            disabled={archiveCompletedMutation.isPending}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-xs disabled:opacity-50"
          >
            <Archive size={16} />
            {archiveCompletedMutation.isPending
              ? "Archivage..."
              : "Nettoyer les terminées"}
          </button>

          {/* Bouton afficher/masquer archivées */}
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
          {/* Mode d'affichage */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                viewMode === "kanban"
                  ? "bg-[#6C4EA8] text-white"
                  : "bg-[#2a2a2d] text-gray-300"
              }`}
            >
              <LayoutGrid size={16} />
              Tableau
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                viewMode === "list"
                  ? "bg-[#6C4EA8] text-white"
                  : "bg-[#2a2a2d] text-gray-300"
              }`}
            >
              <List size={16} />
              Liste
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
            {/* Recherche */}
            <div className="relative flex-1 md:w-48">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#2a2a2d] border border-gray-700 rounded-lg w-full focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
              <div className="w-full sm:w-auto">
                <ProjectFilter
                  projects={projects}
                  selectedProject={selectedProject}
                  onProjectChange={setSelectedProject}
                />
              </div>
              <div className="w-full sm:w-auto">
                <PriorityFilter
                  selectedPriority={selectedPriority}
                  onPriorityChange={setSelectedPriority}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau Kanban */}
      {viewMode === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex gap-3 min-w-max">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  bg={column.bg}
                  count={
                    filteredTasks.filter((t) => t.status === column.id).length
                  }
                  onAddTask={(status) => {
                    setDefaultStatusForNewTask(status as TaskStatus);
                    setShowTaskForm(true);
                  }}
                >
                  <SortableContext
                    items={filteredTasks
                      .filter((t) => t.status === column.id)
                      .map((t) => t._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredTasks
                      .filter((task) => task.status === column.id)
                      .map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          subtasks={subtasksMap[task._id] || []}
                          loadingSubtasks={
                            loadingSubtasksMap[task._id] || false
                          }
                          isSubtasksExpanded={expandedTasks[task._id] || false}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onAddSubtask={handleAddSubtask}
                          onToggleSubtasks={handleToggleSubtasks}
                        />
                      ))}
                  </SortableContext>
                </KanbanColumn>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-3 opacity-90 w-72">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onAddSubtask={() => {}}
                  onToggleSubtasks={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Vue Liste */}
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
                  <th className="text-left p-3 text-xs">Assignations</th>
                  <th className="text-left p-3 text-xs">Statut</th>
                  <th className="text-left p-3 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task._id}
                    className="border-t border-gray-800 hover:bg-gray-900/50"
                  >
                    <td className="p-3">
                      <div className="font-medium text-xs">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {task.description}
                        </div>
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
                          {new Date(task.end_date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex -space-x-2">
                        {task.assignees?.slice(0, 3).map((user) => (
                          <div
                            key={user?._id || Math.random()}
                            className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-xs border-2 border-[#1a1a1d]"
                            title={`${user?.prenoms || ""} ${user?.nom || ""}`}
                          >
                            {user?.prenoms?.charAt(0) || ""}
                            {user?.nom?.charAt(0) || ""}
                          </div>
                        ))}
                        {task.assignees &&
                          task.assignees.filter((a) => a).length > 3 && (
                            <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs border-2 border-[#1a1a1d]">
                              +{task.assignees.filter((a) => a).length - 3}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTask(task._id)}
                          className="p-1 hover:bg-gray-700 rounded text-xs"
                          title="Modifier"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1 hover:bg-red-900/30 rounded text-red-400 text-xs"
                          title="Supprimer"
                        >
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

      {/* Form overlay pour nouvelle tâche */}
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

      {/* Modal ajout sous-tâche */}
      {showSubtaskForm && (
        <AddSubtaskModal
          isShared={showSubtaskForm.isShared}
          assignees={users}
          onSubmit={(data) => handleCreateSubtask(showSubtaskForm.taskId, data)}
          onCancel={() => setShowSubtaskForm(null)}
        />
      )}

      {/* Modal détail sous-tâche */}
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

      {/* Modal détail tâche */}
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

// Composants helper
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors = {
    [TaskPriority.URGENTE]: "bg-red-500/20 text-red-300 border-red-500",
    [TaskPriority.ELEVEE]: "bg-orange-500/20 text-orange-300 border-orange-500",
    [TaskPriority.NORMALE]: "bg-blue-500/20 text-blue-300 border-blue-500",
    [TaskPriority.BASSE]: "bg-gray-500/20 text-gray-300 border-gray-500",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs border ${colors[priority]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const colors = {
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

