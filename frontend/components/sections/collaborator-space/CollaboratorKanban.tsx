"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Lock,
  Calendar,
  Flag,
  Users,
  Briefcase,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/lib/task-service";
import { projectService, Project } from "@/lib/project-service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CollaboratorKanbanProps {
  collaborator: any;
  tasks: Task[];
  loading: boolean;
  onLoadSubtasks?: (taskId: string) => Promise<Task[]>;
}

export default function CollaboratorKanban({
  collaborator,
  tasks,
  loading,
  onLoadSubtasks,
}: CollaboratorKanbanProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [loadingSubtasks, setLoadingSubtasks] = useState<Record<string, boolean>>({});
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error("Erreur chargement projets:", error);
    }
  };

  const handleToggleSubtasks = async (taskId: string) => {
    const isExpanded = !expandedTasks[taskId];

    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: isExpanded,
    }));

    if (isExpanded && onLoadSubtasks && !subtasksMap[taskId]) {
      setLoadingSubtasks((prev) => ({ ...prev, [taskId]: true }));
      try {
        const subtasks = await onLoadSubtasks(taskId);
        setSubtasksMap((prev) => ({
          ...prev,
          [taskId]: subtasks,
        }));
      } catch (error) {
        console.error("Erreur chargement sous-tâches:", error);
      } finally {
        setLoadingSubtasks((prev) => ({ ...prev, [taskId]: false }));
      }
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Colonnes Kanban compactes
  const columns = [
    {
      id: TaskStatus.A_FAIRE,
      title: "À FAIRE",
      color: "border-gray-800",
      bg: "bg-gray-900/20",
      dot: "bg-gray-500"
    },
    {
      id: TaskStatus.EN_COURS,
      title: "EN COURS",
      color: "border-gray-800",
      bg: "bg-[#6C4EA815]",
      dot: "bg-purple-500"
    },
    {
      id: TaskStatus.TERMINEE,
      title: "TERMINÉ",
      color: "border-gray-800",
      bg: "bg-[#71D29115]",
      dot: "bg-green-500"
    },
    {
      id: TaskStatus.ANNULEE,
      title: "ANNULÉ",
      color: "border-gray-800",
      bg: "bg-red-900/10",
      dot: "bg-red-500"
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Tableau Kanban compact */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-60 sm:w-64 rounded-lg border ${column.color}`}
            >
              {/* En-tête de colonne */}
              <div className={`p-2 rounded-t-lg ${column.bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.dot}`} />
                    <h3 className="text-xs font-semibold">{column.title}</h3>
                    <span className="px-1.5 py-0.5 text-xs bg-black/20 rounded">
                      {columnTasks.length}
                    </span>
                  </div>
                  <Lock size={12} className="text-gray-400" />
                </div>
              </div>

              {/* Liste des tâches */}
              <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {columnTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-[#141416] border border-gray-800 rounded p-3 opacity-90"
                  >
                    {/* Titre et description */}
                    <div className="mb-2">
                      <h4 className="text-xs font-medium leading-tight">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Métadonnées */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {/* Priorité */}
                        <div
                          className={`flex items-center gap-0.5 border rounded px-1 py-0.5 ${
                            task.priority === TaskPriority.URGENTE
                              ? "text-red-400 border-red-400"
                              : task.priority === TaskPriority.ELEVEE
                              ? "text-orange-400 border-orange-400"
                              : task.priority === TaskPriority.NORMALE
                              ? "text-blue-400 border-blue-400"
                              : "text-gray-400 border-gray-400"
                          }`}
                        >
                          <Flag size={9} />
                          <span className="text-[10px] capitalize">{task.priority}</span>
                        </div>

                        {/* Deadline */}
                        {task.end_date && (
                          <div
                            className={`flex items-center gap-1 ${
                              new Date(task.end_date) < new Date()
                                ? "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            <Calendar size={9} />
                            <span>
                              {format(new Date(task.end_date), "d MMM", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Projet */}
                    {task.project_id && (
                      <div className="mt-2">
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-900/20 text-blue-300 rounded">
                          {task.project_id.name}
                        </span>
                      </div>
                    )}

                    {/* Sous-tâches */}
                    {task.sub_tasks && task.sub_tasks.length > 0 && (
                      <div className="mt-3 border-t border-gray-800/30 pt-2">
                        <button
                          onClick={() => handleToggleSubtasks(task._id)}
                          className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-gray-300 p-0.5 rounded"
                        >
                          <div className="flex items-center gap-1.5">
                            {expandedTasks[task._id] ? (
                              <ChevronDown size={10} />
                            ) : (
                              <ChevronRight size={10} />
                            )}
                            <span>{task.sub_tasks.length} sous-tâche(s)</span>
                          </div>
                          {loadingSubtasks[task._id] && (
                            <div className="w-2.5 h-2.5 border border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </button>

                        {expandedTasks[task._id] && subtasksMap[task._id] && (
                          <div className="mt-1.5 space-y-1">
                            {subtasksMap[task._id].map((subtask) => (
                              <div
                                key={subtask._id}
                                className="bg-[#1a1a1d] border border-gray-700/30 rounded p-1.5 text-xs"
                              >
                                <div className="font-medium text-gray-300">
                                  {subtask.title}
                                </div>
                                {subtask.description && (
                                  <div className="text-gray-500 mt-0.5 text-xs">
                                    {subtask.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Message si aucune tâche */}
      {tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Eye className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-sm font-medium mb-1">Aucune tâche trouvée</h3>
          <p className="text-xs text-gray-400">
            Ce collaborateur n'a pas encore de tâches.
          </p>
        </div>
      )}
    </div>
  );
}