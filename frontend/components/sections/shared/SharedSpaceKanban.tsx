"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Settings, UserPlus, Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Space, spaceService } from "@/lib/space-service";
import {
  sharedTaskService,
  Task,
  TaskStatus,
  CreateTaskDto,
  CreateSubtaskDto,
} from "@/lib/task-service";
import { projectService, Project } from "@/lib/project-service";
import { usersService } from "@/lib/users-service";
import KanbanColumn from "../kanban/KanbanColumn";
import TaskCard from "../kanban/TaskCard";
import QuickTaskForm from "../kanban/QuickTaskForm";
import AddSubtaskModal from "../kanban/AddSubtaskModal";
import SpacePermissionsModal from "./PermissionsModal";
import TaskDetailModal from "../kanban/TaskDetailModal";
import SubtaskDetailModal from "../kanban/SubtaskDetailModal";

interface SharedSpaceKanbanProps {
  space: Space;
}

export default function SharedSpaceKanban({ space }: SharedSpaceKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [loadingSubtasksMap, setLoadingSubtasksMap] = useState<
    Record<string, boolean>
  >({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(
          `expanded_tasks_shared_${space._id}`
        );
        return saved ? JSON.parse(saved) : {};
      }
      return {};
    }
  );

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState<{
    taskId: string;
    isShared: boolean;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<Task | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [userPermission, setUserPermission] = useState<string>("viewer");
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const [defaultStatusForNewTask, setDefaultStatusForNewTask] = useState<
    TaskStatus | undefined
  >(undefined);

  // Récupérer userData de manière sécurisée
  const userData = useMemo(() => {
    try {
      const data = localStorage.getItem("userData");
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }, []);

  const canEdit = useMemo(
    () => userPermission === "editor" || userPermission === "super_editor",
    [userPermission]
  );

  // Sensors pour le drag & drop
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

  useEffect(() => {
    loadData();
    checkUserPermission();
  }, [space._id]);

  // Sauvegarder l'état des tâches déployées
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `expanded_tasks_shared_${space._id}`,
        JSON.stringify(expandedTasks)
      );
    }
  }, [expandedTasks, space._id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData, usersData] = await Promise.all([
        sharedTaskService.getSpaceTasks(space._id),
        projectService.getAll(),
        usersService.searchUsers({}),
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

  const checkUserPermission = async () => {
    try {
      setPermissionsLoading(true);

      const userDataStr = localStorage.getItem("userData");

      if (!userDataStr) {
        console.error("Aucune donnée utilisateur dans localStorage");
        setUserPermission("viewer");
        return;
      }

      const userData = JSON.parse(userDataStr);
      const userId = userData.userId || userData._id || userData.id;

      if (!userId) {
        console.error("Impossible de trouver l'ID utilisateur");
        setUserPermission("viewer");
        return;
      }

      // 1. Les admins et managers sont toujours super_editor
      if (userData.role === "admin" || userData.role === "manager") {
        console.log("Admin/Manager détecté");
        setUserPermission("super_editor");
        return;
      }

      // 2. Le créateur de l'espace est toujours super_editor
      if (space.createdBy._id === userId) {
        console.log("Créateur de l'espace détecté");
        setUserPermission("super_editor");
        return;
      }

      // 3. Vérifier les permissions depuis l'API
      const permissions = await spaceService.getPermissions(space._id);

      const userPerm = permissions.find((p: any) => {
        const permUserId = p.userId._id || p.userId;
        return permUserId === userId;
      });

      if (userPerm) {
        setUserPermission(userPerm.permissionLevel);
      } else {
        console.warn("Aucune permission trouvée, défaut à viewer");
        setUserPermission("viewer");
      }
    } catch (error) {
      console.error("Erreur vérification permission:", error);
      setUserPermission("viewer");
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Charger les sous-tâches pour une tâche spécifique
  const loadSubtasks = async (taskId: string) => {
    setLoadingSubtasksMap((prev) => ({ ...prev, [taskId]: true }));
    try {
      const subtasks = await sharedTaskService.getSubtasks(space._id, taskId);
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
    if (
      show &&
      canEdit &&
      !subtasksMap[taskId] &&
      !loadingSubtasksMap[taskId]
    ) {
      loadSubtasks(taskId);
    }
  };

  // Gestion du drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = event.active.id as string;
      const task = tasks.find((t) => t._id === taskId);
      setActiveTask(task || null);
    },
    [tasks]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !canEdit) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    try {
      // Mettre à jour immédiatement l'UI
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
      await sharedTaskService.update(space._id, taskId, { status: newStatus });
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      loadData(); // Recharger en cas d'erreur
    } finally {
      setActiveTask(null);
    }
  };

  const handleCreateTask = async (data: CreateTaskDto) => {
    if (!canEdit) return;

    try {
      const newTask = await sharedTaskService.create(space._id, data);
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
    if (!canEdit) return;

    try {
      const newSubtask = await sharedTaskService.createSubtask(
        space._id,
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

  // Gérer l'ajout d'une sous-tâche
  const handleAddSubtask = (taskId: string) => {
    if (!canEdit) return;
    setShowSubtaskForm({
      taskId,
      isShared: true,
    });
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    if (!canEdit) return;

    try {
      const updatedTask = await sharedTaskService.update(
        space._id,
        taskId,
        data
      );

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

      // Si on ne l'a pas trouvé, vérifier dans la réponse
      if (!isSubtask && updatedTask.parentTaskId) {
        isSubtask = true;
        parentId = updatedTask.parentTaskId as string;
      }

      if (isSubtask && parentId) {
        // Mettre à jour dans la map des sous-tâches
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).map((st) =>
            st._id === taskId ? { ...st, ...updatedTask } : st
          ),
        }));
      } else {
        // Si c'est une tâche parente
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId ? { ...task, ...updatedTask } : task
          )
        );

        // Si le projet ou la deadline a changé, mettre à jour les sous-tâches
        if (
          (data.project_id || data.end_date || data.status) &&
          subtasksMap[taskId]
        ) {
          setSubtasksMap((prev) => ({
            ...prev,
            [taskId]: prev[taskId].map((subtask) => ({
              ...subtask,
              project_id:
                data.project_id !== undefined
                  ? updatedTask.project_id
                  : subtask.project_id,
              end_date:
                data.end_date !== undefined
                  ? updatedTask.end_date
                  : subtask.end_date,
              status:
                data.status !== undefined ? updatedTask.status : subtask.status,
            })),
          }));
        }
      }

      setSelectedTask(null);
    } catch (error) {
      console.error("Erreur mise à jour tâche:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canEdit) return;
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

      await sharedTaskService.delete(space._id, taskId);

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
      } else {
        // Supprimer la tâche parente
        setTasks((prev) => prev.filter((task) => task._id !== taskId));

        // Supprimer aussi ses sous-tâches de la map
        setSubtasksMap((prev) => {
          const newMap = { ...prev };
          delete newMap[taskId];
          return newMap;
        });

        // Supprimer de l'état des tâches déployées
        setExpandedTasks((prev) => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
      }

      setSelectedTask(null);
    } catch (error) {
      console.error("Erreur suppression tâche:", error);
    }
  };

  // Gérer l'édition d'une tâche
  const handleEditTask = (taskId: string) => {
    if (!canEdit) return;

    // D'abord chercher dans les sous-tâches
    for (const parentId in subtasksMap) {
      const subtask = subtasksMap[parentId].find((st) => st._id === taskId);
      if (subtask) {
        setSelectedSubtask(subtask); // Utiliser le state des sous-tâches
        return;
      }
    }

    // Si pas trouvé dans les sous-tâches, chercher dans les tâches parentes
    const parentTask = tasks.find((t) => t._id === taskId);
    if (parentTask) {
      setSelectedTask(parentTask);
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex-1 p-6">
      {/* En-tête de l'espace */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-extrabold">{space.name}</h1>
            {space.description && (
              <p className="text-gray-400 mt-1">{space.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Indicateur de permission */}
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                userPermission === "super_editor"
                  ? "bg-purple-500/20 text-purple-300"
                  : userPermission === "editor"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-gray-500/20 text-gray-300"
              }`}
            >
              {userPermission === "super_editor"
                ? "Super Éditeur"
                : userPermission === "editor"
                ? "Éditeur"
                : "Visionneur"}
            </div>

            {/* Bouton inviter */}
            {canEdit && (
              <button
                onClick={() => setShowPermissions(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                <UserPlus size={18} />
                Inviter
              </button>
            )}

            {/* Bouton paramètres (seulement pour super_editors et admins) */}
            {(userPermission === "super_editor" ||
              userData.role === "admin") && (
              <button
                onClick={() => setShowPermissions(true)}
                className="p-2 hover:bg-gray-800 rounded-lg"
                title="Paramètres de l'espace"
              >
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>
              Créé par {space.createdBy.prenoms} {space.createdBy.nom}
            </span>
          </div>
          <div>
            <span>{tasks.length} tâches</span>
          </div>
        </div>
      </div>

      {/* Bouton nouvelle tâche (seulement si on peut éditer) */}
      {canEdit && (
        <div className="mb-6">
          <button
            onClick={() => {
              setDefaultStatusForNewTask(undefined);
              setShowTaskForm(true);
            }}
            className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white px-4 py-2 rounded-lg transition"
          >
            + Nouvelle tâche
          </button>
        </div>
      )}

      {/* Tableau Kanban */}
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
              count={tasks.filter((t) => t.status === column.id).length}
              onAddTask={(status) => {
                if (canEdit) {
                  setDefaultStatusForNewTask(status as TaskStatus);
                  setShowTaskForm(true);
                }
              }}
            >
              <SortableContext
                items={tasks
                  .filter((t) => t.status === column.id)
                  .map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                {tasks
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
                      disabled={!canEdit}
                    />
                  ))}
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>

        {/* DragOverlay pour un feedback visuel */}
        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 opacity-90">
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

      {/* Form overlay pour nouvelle tâche */}
      {showTaskForm && canEdit && (
        <QuickTaskForm
          projects={projects}
          users={users}
          currentUserId={userData?._id}
          isShared={true}
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
      {showSubtaskForm && canEdit && (
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
          onUpdate={(taskId, data) => handleUpdateTask(taskId, data)}
          onDelete={handleDeleteTask}
          onClose={() => setSelectedSubtask(null)}
          isShared={true}
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
          isPersonal={false}
        />
      )}

      {/* Modal permissions */}
      {showPermissions && (
        <SpacePermissionsModal
          space={space}
          onClose={() => {
            setShowPermissions(false);
            // Recharger les permissions après fermeture du modal
            checkUserPermission();
          }}
        />
      )}
    </div>
  );
}
