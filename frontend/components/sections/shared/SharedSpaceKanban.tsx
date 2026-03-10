"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Users, UserPlus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  CollisionDetection,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  UniqueIdentifier,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
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
import SharedQuickTaskForm from "./SharedQuickTaskForm";
import AddSubtaskModal from "../kanban/AddSubtaskModal";
import SpacePermissionsModal from "./PermissionsModal";
import TaskDetailModal from "../kanban/TaskDetailModal";
import SubtaskDetailModal from "../kanban/SubtaskDetailModal";

// ── Colonnes ────────────────────────────────────────────────────────────────
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

// ── Helper ───────────────────────────────────────────────────────────────────
function getColumnIdFromId(id: UniqueIdentifier): TaskStatus | null {
  const str = String(id);
  if (str.startsWith("col-")) {
    return str.replace("col-", "") as TaskStatus;
  }
  return null;
}

interface SharedSpaceKanbanProps {
  space: Space;
}

export default function SharedSpaceKanban({ space }: SharedSpaceKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── columnTaskIds : même pattern que TachesSection ──────────────────────
  const [columnTaskIds, setColumnTaskIds] = useState<Record<string, string[]>>({
    [TaskStatus.A_FAIRE]: [],
    [TaskStatus.EN_COURS]: [],
    [TaskStatus.TERMINEE]: [],
    [TaskStatus.ANNULEE]: [],
  });

  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [loadingSubtasksMap, setLoadingSubtasksMap] = useState<
    Record<string, boolean>
  >({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(
          `expanded_tasks_shared_${space._id}`,
        );
        return saved ? JSON.parse(saved) : {};
      }
      return {};
    },
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

  // Ref pour éviter les re-renders inutiles dans handleDragOver
  const recentlyMovedToNewContainer = useRef(false);
  const lastOverId = useRef<UniqueIdentifier | null>(null);

  // ── userData ─────────────────────────────────────────────────────────────
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
    [userPermission],
  );

  // ── Sensors ───────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
    checkUserPermission();
  }, [space._id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `expanded_tasks_shared_${space._id}`,
        JSON.stringify(expandedTasks),
      );
    }
  }, [expandedTasks, space._id]);

  // ── Sync columnTaskIds quand tasks change ────────────────────────────────
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
  }, [tasks]);

  // ── loadData ─────────────────────────────────────────────────────────────
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

  // ── checkUserPermission ───────────────────────────────────────────────────
  const checkUserPermission = async () => {
    try {
      setPermissionsLoading(true);
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) {
        setUserPermission("viewer");
        return;
      }
      const userData = JSON.parse(userDataStr);
      const userId = userData.userId || userData._id || userData.id;

      if (!userId) {
        setUserPermission("viewer");
        return;
      }
      if (userData.role === "admin" || userData.role === "manager") {
        setUserPermission("super_editor");
        return;
      }
      if (space.createdBy?._id === userId) {
        setUserPermission("super_editor");
        return;
      }
      const permissions = await spaceService.getPermissions(space._id);
      const validPermissions = permissions.filter(
        (p: any) => p.userId && p.userId._id,
      );
      const userPerm = validPermissions.find(
        (p: any) => p.userId._id === userId,
      );
      setUserPermission(userPerm ? userPerm.permissionLevel : "viewer");
    } catch (error) {
      console.error("Erreur vérification permission:", error);
      setUserPermission("viewer");
    } finally {
      setPermissionsLoading(false);
    }
  };

  // ── loadSubtasks ──────────────────────────────────────────────────────────
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

  const handleToggleSubtasks = (taskId: string, show: boolean) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: show }));
    if (show && !subtasksMap[taskId] && !loadingSubtasksMap[taskId]) {
      loadSubtasks(taskId);
    }
  };

  // ── CollisionDetection (identique à TachesSection) ───────────────────────
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      const { droppableContainers } = args;

      // Prioriser les colonnes
      const columnCollisions = pointerWithin({
        ...args,
        droppableContainers: droppableContainers.filter((c) =>
          String(c.id).startsWith("col-"),
        ),
      });

      if (columnCollisions.length > 0) {
        const columnId = getColumnIdFromId(columnCollisions[0].id);
        if (columnId) {
          const tasksInColumn = droppableContainers.filter(
            (c) =>
              !String(c.id).startsWith("col-") &&
              columnTaskIds[columnId]?.includes(String(c.id)),
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
    [columnTaskIds],
  );

  // ── handleDragStart ───────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t._id === event.active.id);
      setActiveTask(task || null);
    },
    [tasks],
  );

  // ── handleDragOver (déplacement inter-colonnes en temps réel) ────────────
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
      if (sourceColumnId === targetColumnId) return; // géré dans onDragEnd

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
    [columnTaskIds],
  );

  // ── handleDragEnd ─────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !canEdit) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Trouver la colonne cible finale
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

      // Trouver la colonne source
      let sourceColumnId: string | null = null;
      for (const [colId, ids] of Object.entries(columnTaskIds)) {
        if (ids.includes(activeId)) {
          sourceColumnId = colId;
          break;
        }
      }

      if (!targetColumnId || !sourceColumnId) return;

      // Réordonnancement dans la même colonne
      if (sourceColumnId === targetColumnId) {
        const colIds = [...columnTaskIds[sourceColumnId]];
        const oldIndex = colIds.indexOf(activeId);
        const newIndex = colIds.indexOf(overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newIds = arrayMove(colIds, oldIndex, newIndex);
          setColumnTaskIds((prev) => ({
            ...prev,
            [sourceColumnId!]: newIds,
          }));
        }
        return; // Pas de changement de statut
      }

      // Changement de colonne → mise à jour du statut
      const newStatus = targetColumnId as TaskStatus;

      // Mise à jour optimiste du state tasks
      setTasks((prev) =>
        prev.map((task) =>
          task._id === activeId ? { ...task, status: newStatus } : task,
        ),
      );

      try {
        await sharedTaskService.update(space._id, activeId, {
          status: newStatus,
        });
      } catch (error) {
        console.error("Erreur mise à jour statut:", error);
        // Rollback : recharger depuis le serveur
        loadData();
      }
    },
    [columnTaskIds, canEdit, space._id],
  );

  // ── CRUD ──────────────────────────────────────────────────────────────────
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

  const handleCreateSubtask = async (
    parentTaskId: string,
    data: CreateSubtaskDto,
  ) => {
    if (!canEdit) return;
    try {
      const newSubtask = await sharedTaskService.createSubtask(
        space._id,
        parentTaskId,
        data,
      );
      setSubtasksMap((prev) => ({
        ...prev,
        [parentTaskId]: [...(prev[parentTaskId] || []), newSubtask],
      }));
      setTasks((prev) =>
        prev.map((task) =>
          task._id === parentTaskId
            ? { ...task, sub_tasks: [...task.sub_tasks, newSubtask._id] }
            : task,
        ),
      );
      setShowSubtaskForm(null);
    } catch (error) {
      console.error("Erreur création sous-tâche:", error);
    }
  };

  const handleAddSubtask = (taskId: string) => {
    if (!canEdit) return;
    setShowSubtaskForm({ taskId, isShared: true });
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    if (!canEdit) return;
    try {
      const updatedTask = await sharedTaskService.update(
        space._id,
        taskId,
        data,
      );

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
      if (!isSubtask && updatedTask.parentTaskId) {
        isSubtask = true;
        parentId = updatedTask.parentTaskId as string;
      }

      if (isSubtask && parentId) {
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId!]: (prev[parentId!] || []).map((st) =>
            st._id === taskId ? { ...st, ...updatedTask } : st,
          ),
        }));
        setSelectedSubtask(null);
      } else {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId ? { ...task, ...updatedTask } : task,
          ),
        );
        if ((data.project_id || data.end_date || data.status) && subtasksMap[taskId]) {
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
        setSelectedTask(null);
      }
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

      const isSubtask =
        taskToDelete.parentTaskId !== undefined &&
        taskToDelete.parentTaskId !== null;

      await sharedTaskService.delete(space._id, taskId);

      if (isSubtask) {
        const parentId = taskToDelete.parentTaskId as string;
        setSubtasksMap((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((st) => st._id !== taskId),
        }));
        setTasks((prev) =>
          prev.map((task) =>
            task._id === parentId
              ? {
                  ...task,
                  sub_tasks: task.sub_tasks.filter((id) => id !== taskId),
                }
              : task,
          ),
        );
      } else {
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
        setSubtasksMap((prev) => {
          const newMap = { ...prev };
          delete newMap[taskId];
          return newMap;
        });
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

  const handleEditTask = (taskId: string) => {
    if (!canEdit) return;
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

  // ── Computed : tâches par colonne dans l'ordre de columnTaskIds ──────────
  const getColumnTasks = (columnId: string): Task[] => {
    const orderedIds = columnTaskIds[columnId] || [];
    return orderedIds
      .map((id) => tasks.find((t) => t._id === id))
      .filter(Boolean) as Task[];
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || permissionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 p-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold">{space.name}</h1>
            {space.description && (
              <p className="text-gray-400 mt-1 text-xs">{space.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {userPermission === "super_editor" && (
              <button
                onClick={() => setShowPermissions(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm transition text-xs"
              >
                <UserPlus size={16} />
                Inviter
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 text-gray-400 text-xs">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>
              Créé par {space.createdBy?.prenoms || ""}{" "}
              {space.createdBy?.nom || ""}
            </span>
          </div>
          <span>{tasks.length} tâches</span>
        </div>
      </div>

      {/* Bouton nouvelle tâche */}
      {canEdit && (
        <div className="mb-6">
          <button
            onClick={() => {
              setDefaultStatusForNewTask(undefined);
              setShowTaskForm(true);
            }}
            className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white px-4 py-2 rounded-sm transition text-xs"
          >
            + Nouvelle tâche
          </button>
        </div>
      )}

      {/* Kanban */}
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
                    if (canEdit) {
                      setDefaultStatusForNewTask(status as TaskStatus);
                      setShowTaskForm(true);
                    }
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
                      disabled={!canEdit}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>
        </div>

        {/* DragOverlay */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
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

      {/* Modals */}
      {showTaskForm && canEdit && (
        <SharedQuickTaskForm
          spaceId={space._id}
          projects={projects}
          currentUserId={userData?._id}
          defaultStatus={defaultStatusForNewTask}
          defaultColumnStatus={defaultStatusForNewTask}
          onSubmit={handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false);
            setDefaultStatusForNewTask(undefined);
          }}
        />
      )}

      {showSubtaskForm && canEdit && (
        <AddSubtaskModal
          isShared={showSubtaskForm.isShared}
          assignees={users}
          onSubmit={(data) =>
            handleCreateSubtask(showSubtaskForm.taskId, data)
          }
          onCancel={() => setShowSubtaskForm(null)}
        />
      )}

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

      {showPermissions && (
        <SpacePermissionsModal
          space={space}
          onClose={() => {
            setShowPermissions(false);
            checkUserPermission();
          }}
        />
      )}
    </div>
  );
}