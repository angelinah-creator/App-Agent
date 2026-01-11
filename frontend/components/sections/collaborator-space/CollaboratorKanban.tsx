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
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    {}
  );
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [loadingSubtasks, setLoadingSubtasks] = useState<
    Record<string, boolean>
  >({});
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

  // Grouper les tâches par statut
  const groupedTasks = tasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* En-tête du collaborateur */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold">
                {collaborator.prenoms?.charAt(0)}
                {collaborator.nom?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">
                {collaborator.prenoms} {collaborator.nom}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-gray-400">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} />
                  <span>{collaborator.poste || "Aucun poste"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span className="capitalize">
                    {collaborator.profile || collaborator.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full">
                  <Eye size={14} />
                  <span className="text-sm">Mode consultation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {columns.map((column) => {
            const count = groupedTasks[column.id]?.length || 0;
            return (
              <div
                key={column.id}
                className={`p-4 rounded-xl border ${column.color} ${column.bg}`}
              >
                <div className="text-2xl font-bold mb-1">{count}</div>
                <div className="text-sm text-gray-300">{column.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tableau Kanban en lecture seule */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-80 rounded-xl border ${column.color}`}
            >
              {/* En-tête de colonne */}
              <div className={`p-4 rounded-t-xl ${column.bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        column.id === TaskStatus.A_FAIRE
                          ? "bg-gray-500"
                          : column.id === TaskStatus.EN_COURS
                          ? "bg-purple-500"
                          : column.id === TaskStatus.TERMINEE
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <h3 className="font-semibold">{column.title}</h3>
                    <span className="px-2 py-1 text-xs bg-black/30 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <Lock size={16} className="text-gray-400" />
                </div>
              </div>

              {/* Liste des tâches */}
              <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {columnTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-[#141416] border border-gray-800 rounded-lg p-4 opacity-90"
                  >
                    {/* En-tête */}
                    <div className="mb-3">
                      <h4 className="font-medium text-sm leading-tight">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Métadonnées */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {/* Priorité */}
                        <div
                          className={`flex items-center gap-1 border rounded px-1 ${
                            task.priority === TaskPriority.URGENTE
                              ? "text-red-400 border-red-400"
                              : task.priority === TaskPriority.ELEVEE
                              ? "text-orange-400 border-orange-400"
                              : task.priority === TaskPriority.NORMALE
                              ? "text-blue-400 border-blue-400"
                              : "text-gray-400 border-gray-400"
                          }`}
                        >
                          <Flag size={10} />
                          <span className="capitalize">{task.priority}</span>
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
                            <Calendar size={10} />
                            <span>
                              {format(new Date(task.end_date), "d MMMM", {
                                locale: fr,
                              })}
                            </span>
                            {new Date(task.end_date) < new Date() && (
                              <Clock size={10} className="ml-1" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Projet */}
                    {task.project_id && (
                      <div className="mt-3">
                        <span className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded">
                          {task.project_id.name}
                        </span>
                      </div>
                    )}

                    {/* Sous-tâches */}
                    {task.sub_tasks && task.sub_tasks.length > 0 && (
                      <div className="mt-4 border-t border-gray-800/50 pt-3">
                        <button
                          onClick={() => handleToggleSubtasks(task._id)}
                          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-300 transition-colors p-1 rounded"
                        >
                          <div className="flex items-center gap-2">
                            {expandedTasks[task._id] ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                            <span>{task.sub_tasks.length} sous-tâche(s)</span>
                          </div>
                          {loadingSubtasks[task._id] && (
                            <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </button>

                        {expandedTasks[task._id] && subtasksMap[task._id] && (
                          <div className="mt-2 space-y-1">
                            {subtasksMap[task._id].map((subtask) => (
                              <div
                                key={subtask._id}
                                className="bg-[#1a1a1d] border border-gray-700/50 rounded p-2 text-xs"
                              >
                                <div className="font-medium text-gray-300">
                                  {subtask.title}
                                </div>
                                {subtask.description && (
                                  <div className="text-gray-500 mt-1">
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
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Aucune tâche trouvée</h3>
          <p className="text-gray-400">
            Ce collaborateur n'a pas encore de tâches dans son espace personnel.
          </p>
        </div>
      )}
    </div>
  );
}
