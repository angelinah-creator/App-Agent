"use client";

import { useState, useEffect, useCallback } from "react";
import {
  List,
  LayoutGrid,
  Search,
  ChevronDown,
  Users,
  Calendar,
  Flag,
  Plus,
  Filter,
  X,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
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


export function TachesSection() {
  const [userData, setUserData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<
    TaskPriority | "all"
  >("all");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [loadingSubtasksMap, setLoadingSubtasksMap] = useState<
    Record<string, boolean>
  >({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    () => {
      // Charger l'état sauvegardé depuis localStorage
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("expanded_tasks_personal");
        return saved ? JSON.parse(saved) : {};
      }
      return {};
    }
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Charger les données
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
    loadData();
  }, []);

  // Sauvegarder l'état des tâches déployées
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "expanded_tasks_personal",
        JSON.stringify(expandedTasks)
      );
    }
  }, [expandedTasks]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData, usersData] = await Promise.all([
        personalTaskService.getMyTasks(),
        projectService.getAll(),
        usersService.searchUsers({ role: "collaborateur" }),
      ]);

      setTasks(tasksData);
      setProjects(projectsData);
      setUsers(usersData);

      // Charger les sous-tâches pour les tâches déjà déployées
      const promises = [];
      for (const taskId in expandedTasks) {
        if (expandedTasks[taskId]) {
          promises.push(loadSubtasks(taskId));
        }
      }
      await Promise.all(promises);
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Grouper les tâches par statut
  const groupedTasks = tasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Filtrer les tâches
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
    [tasks]
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
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, status: newStatus } : task
        )
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
      // Revert en cas d'erreur
      loadData();
    } finally {
      setActiveId(null);
      setActiveTask(null);
    }
  };

  // Créer une tâche
  const handleCreateTask = async (data: CreateTaskDto) => {
    try {
      const newTask = await personalTaskService.create(data);
      setTasks((prev) => [...prev, newTask]);
      setShowTaskForm(false);
    } catch (error) {
      console.error("Erreur création tâche:", error);
    }
  };

  // Créer une sous-tâche
  const handleCreateSubtask = async (
    parentTaskId: string,
    data: CreateSubtaskDto
  ) => {
    try {
      const newSubtask = await personalTaskService.createSubtask(
        parentTaskId,
        data
      );

      // Mettre à jour les sous-tâches dans la map
      setSubtasksMap((prev) => ({
        ...prev,
        [parentTaskId]: [...(prev[parentTaskId] || []), newSubtask],
      }));

      // Mettre à jour le nombre de sous-tâches dans la tâche parente
      setTasks((prev) =>
        prev.map((task) => {
          if (task._id === parentTaskId) {
            return {
              ...task,
              sub_tasks: [...task.sub_tasks, newSubtask._id],
            };
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

      // Chercher si c'est une sous-tâche
      let isSubtask = false;
      let parentId: string | undefined;

      // Chercher dans les sous-tâches existantes
      for (const pid in subtasksMap) {
        const subtask = subtasksMap[pid].find((st) => st._id === taskId);
        if (subtask) {
          isSubtask = true;
          parentId = pid;
          break;
        }
      }

      if (isSubtask && parentId) {
        // Mettre à jour dans la map des sous-tâches
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).map((st) =>
            st._id === taskId ? { ...st, ...updatedTask } : st
          ),
        }));
        // Fermer le modal des sous-tâches
        setSelectedSubtask(null);
      } else {
        // Si c'est une tâche parente
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId ? { ...task, ...updatedTask } : task
          )
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

      // Vérifier si c'est une sous-tâche
      const isSubtask =
        taskToDelete.parentTaskId !== undefined &&
        taskToDelete.parentTaskId !== null;

      await personalTaskService.delete(taskId);

      if (isSubtask) {
        // Supprimer de la map des sous-tâches
        const parentId = taskToDelete.parentTaskId as string;
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((st) => st._id !== taskId),
        }));

        // Mettre à jour la liste des sous-tâches dans la tâche parente
        setTasks((prev) =>
          prev.map((task) => {
            if (task._id === parentId) {
              return {
                ...task,
                sub_tasks: task.sub_tasks.filter((id) => id !== taskId),
              };
            }
            return task;
          })
        );

        // Fermer le modal des sous-tâches
        setSelectedSubtask(null);
      } else {
        // Supprimer la tâche parente
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Erreur suppression tâche:", error);
    }
  };

  // Gérer l'édition d'une tâche
  const handleEditTask = (taskId: string) => {
    console.log("handleEditTask appelé avec taskId:", taskId);

    // D'abord chercher dans les sous-tâches
    for (const parentId in subtasksMap) {
      const subtask = subtasksMap[parentId].find((st) => st._id === taskId);
      if (subtask) {
        console.log("Sous-tâche trouvée:", subtask.title);
        setSelectedSubtask(subtask); // Utiliser le nouveau state
        return;
      }
    }

    // Si pas trouvé dans les sous-tâches, chercher dans les tâches parentes
    const parentTask = tasks.find((t) => t._id === taskId);
    if (parentTask) {
      console.log("Tâche parente trouvée:", parentTask.title);
      setSelectedTask(parentTask);
      return;
    }

    console.warn("Aucune tâche trouvée avec l'ID:", taskId);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] text-gray-100 p-6">
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
    <div className="min-h-screen bg-[#0f0f10] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">Espace Personnel</h1>
          <p className="text-gray-400">Gère tes tâches et marque ton temps</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setDefaultStatusForNewTask(undefined);
              setShowTaskForm(true);
            }}
            className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Barre de contrôle */}
      <div className="mb-6 p-4 bg-[#1a1a1d] rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          {/* Mode d'affichage */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                viewMode === "kanban"
                  ? "bg-[#6C4EA8] text-white"
                  : "bg-[#2a2a2d] text-gray-300"
              }`}
            >
              <LayoutGrid size={18} />
              Tableau
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                viewMode === "list"
                  ? "bg-[#6C4EA8] text-white"
                  : "bg-[#2a2a2d] text-gray-300"
              }`}
            >
              <List size={18} />
              Liste
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="flex items-center gap-3">
            {/* Recherche */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#2a2a2d] border border-gray-700 rounded-lg w-64 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Filtre projet */}
            <ProjectFilter
              projects={projects}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
            />

            {/* Filtre priorité */}
            <PriorityFilter
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
            />
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
          <div className="flex gap-4 overflow-x-auto pb-4">
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
                        loadingSubtasks={loadingSubtasksMap[task._id] || false}
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

          <DragOverlay>
            {activeTask && (
              <div className="rotate-3 opacity-90">
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
          <table className="w-full">
            <thead className="bg-[#2a2a2d]">
              <tr>
                <th className="text-left p-4">Tâche</th>
                <th className="text-left p-4">Priorité</th>
                <th className="text-left p-4">Projet</th>
                <th className="text-left p-4">Deadline</th>
                <th className="text-left p-4">Assignations</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task._id}
                  className="border-t border-gray-800 hover:bg-gray-900/50"
                >
                  <td className="p-4">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-400 mt-1">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="p-4">
                    {task.project_id ? (
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-sm">
                        {task.project_id.name}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {task.end_date ? (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(task.end_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex -space-x-2">
                      {task.assignees?.slice(0, 3).map((user) => (
                        <div
                          key={user?._id || Math.random()}
                          className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs border-2 border-[#1a1a1d]"
                          title={`${user?.prenoms || ""} ${user?.nom || ""}`}
                        >
                          {user?.prenoms?.charAt(0) || ""}
                          {user?.nom?.charAt(0) || ""}
                        </div>
                      ))}
                      {task.assignees &&
                        task.assignees.filter((a) => a).length > 3 && (
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs border-2 border-[#1a1a1d]">
                            +{task.assignees.filter((a) => a).length - 3}
                          </div>
                        )}
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTask(task._id)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-1 hover:bg-red-900/30 rounded text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
