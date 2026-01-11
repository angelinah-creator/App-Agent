"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Flag,
  Users,
  Briefcase,
  Tag,
  Save,
  Trash2,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskDto,
} from "@/lib/task-service";
import { Project } from "@/lib/project-service";

interface TaskDetailModalProps {
  task: Task;
  projects: Project[];
  users: any[];
  onUpdate: (taskId: string, data: UpdateTaskDto) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  isPersonal?: boolean;
}

export default function TaskDetailModal({
  task,
  projects,
  users,
  onUpdate,
  onDelete,
  onClose,
  isPersonal = false,
}: TaskDetailModalProps) {
  const [editedTask, setEditedTask] = useState<UpdateTaskDto>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    project_id: task.project_id?._id,
    assignees: task.assignees?.map((a) => a._id) || [],
    start_date: task.start_date || new Date().toISOString().split("T")[0],
    end_date:
      task.end_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
  });

  const [startDate, setStartDate] = useState<string>(
    task.start_date || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    task.end_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);

  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPriorityDropdown &&
        priorityRef.current &&
        !priorityRef.current.contains(event.target as Node)
      ) {
        setShowPriorityDropdown(false);
      }
      if (
        showAssigneesDropdown &&
        assigneesRef.current &&
        !assigneesRef.current.contains(event.target as Node)
      ) {
        setShowAssigneesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPriorityDropdown, showAssigneesDropdown]);

  useEffect(() => {
    setEditedTask((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  }, [startDate, endDate]);

  const handleSave = () => {
    onUpdate(task._id, editedTask);
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Supprimer cette tâche ?")) {
      onDelete(task._id);
    }
  };

  const isSubtask =
    task.parentTaskId !== undefined && task.parentTaskId !== null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      {/* Container principal avec flex column */}
      <div className="bg-[#1a1a1d] rounded-sm w-full max-w-7xl border border-gray-700 max-h-[90vh] flex flex-col">
        {/* En-tête - fixe */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) =>
                setEditedTask({ ...editedTask, title: e.target.value })
              }
              className="bg-transparent text-xl font-semibold border-b border-gray-600 focus:outline-none focus:border-purple-500"
              autoFocus
              placeholder="Titre de la tâche"
            />
            {isSubtask && (
              <span className="text-xs text-gray-400 ml-2">(Sous-tâche)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
              title="Enregistrer"
            >
              <Save size={18} /> Enregistrer
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg flex items-center gap-2"
              title="Supprimer"
            >
              <Trash2 size={18} /> Supprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenu scrollable avec position relative */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 relative">
          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-6">
            {/* Priorité */}
            <div className="flex items-center gap-4">
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Flag size={14} /> Priorité
              </h3>

              {/* Menu déroulant personnalisé */}
              <div className="relative" ref={priorityRef}>
                <button
                  type="button"
                  className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 text-left flex items-center justify-between"
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        editedTask.priority === TaskPriority.URGENTE
                          ? "bg-red-500"
                          : editedTask.priority === TaskPriority.ELEVEE
                          ? "bg-orange-500"
                          : editedTask.priority === TaskPriority.NORMALE
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }`}
                    >
                      <Flag size={12} className="text-white" />
                    </div>
                    <span className="capitalize">{editedTask.priority}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      showPriorityDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu avec z-50 et position fixed */}
                {showPriorityDropdown && (
                  <div
                    className="fixed z-[100] mt-1 bg-[#2a2a2d] border border-gray-700 rounded-lg shadow-xl overflow-hidden"
                    style={{
                      width: priorityRef.current?.offsetWidth || "auto",
                      top: priorityRef.current
                        ? priorityRef.current.getBoundingClientRect().bottom + 4
                        : 0,
                      left: priorityRef.current
                        ? priorityRef.current.getBoundingClientRect().left
                        : 0,
                    }}
                  >
                    {Object.values(TaskPriority).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-[#3a3a3d] flex items-center gap-2"
                        onClick={() => {
                          setEditedTask({ ...editedTask, priority });
                          setShowPriorityDropdown(false);
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            priority === TaskPriority.URGENTE
                              ? "bg-red-500"
                              : priority === TaskPriority.ELEVEE
                              ? "bg-orange-500"
                              : priority === TaskPriority.NORMALE
                              ? "bg-blue-500"
                              : "bg-gray-500"
                          }`}
                        >
                          <Flag size={12} className="text-white" />
                        </div>
                        <span className="capitalize">{priority}</span>
                        {editedTask.priority === priority && (
                          <Check size={16} className="ml-auto text-green-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Statut */}
            <div>
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Tag size={14} /> Statut
              </h3>
              <select
                value={editedTask.status}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    status: e.target.value as TaskStatus,
                  })
                }
                className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Projet */}
            <div>
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Briefcase size={14} /> Projet
              </h3>
              <select
                value={editedTask.project_id || ""}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    project_id: e.target.value || undefined,
                  })
                }
                className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="">Aucun projet</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {isSubtask && task.project_id && (
                <div className="text-xs text-gray-500 mt-1">
                  (hérité de la tâche parente)
                </div>
              )}
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Calendar size={14} /> Dates
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-16">Début:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-16">Fin:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="flex-1 bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignations (uniquement pour les tâches partagées) */}
          {!isPersonal && (
            <div>
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Users size={14} /> Assigné à
              </h3>

              {/* Bouton d'ouverture du menu */}
              <div className="relative" ref={assigneesRef}>
                <button
                  type="button"
                  onClick={() =>
                    setShowAssigneesDropdown(!showAssigneesDropdown)
                  }
                  className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 text-left focus:outline-none focus:border-purple-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {editedTask.assignees &&
                        editedTask.assignees.length > 0 ? (
                          <>
                            {editedTask.assignees
                              .slice(0, 3)
                              .map((assigneeId) => {
                                const user = users.find(
                                  (u) => u._id === assigneeId
                                );
                                if (!user) return null;
                                return (
                                  <div
                                    key={user._id}
                                    className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs border-2 border-[#2a2a2d]"
                                    title={`${user.prenoms} ${user.nom}`}
                                  >
                                    {user.prenoms?.charAt(0)}
                                    {user.nom?.charAt(0)}
                                  </div>
                                );
                              })}
                            {editedTask.assignees.length > 3 && (
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs border-2 border-[#2a2a2d]">
                                +{editedTask.assignees.length - 3}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">
                            Sélectionner des personnes...
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        showAssigneesDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Menu déroulant avec position fixed */}
                {showAssigneesDropdown && (
                  <div
                    className="fixed z-[100] bg-[#2a2a2d] border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto"
                    style={{
                      width: assigneesRef.current?.offsetWidth || "auto",
                      top: assigneesRef.current
                        ? assigneesRef.current.getBoundingClientRect().bottom +
                          4
                        : 0,
                      left: assigneesRef.current
                        ? assigneesRef.current.getBoundingClientRect().left
                        : 0,
                    }}
                  >
                    {users.map((user) => {
                      const isSelected = editedTask.assignees?.includes(
                        user._id
                      );
                      return (
                        <div
                          key={user._id}
                          className="flex items-center px-3 py-2 hover:bg-[#3a3a3d] cursor-pointer"
                          onClick={() => {
                            const currentAssignees = editedTask.assignees || [];
                            let newAssignees: string[];

                            if (isSelected) {
                              newAssignees = currentAssignees.filter(
                                (id) => id !== user._id
                              );
                            } else {
                              newAssignees = [...currentAssignees, user._id];
                            }

                            setEditedTask({
                              ...editedTask,
                              assignees: newAssignees,
                            });
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                              isSelected
                                ? "bg-purple-600 border-purple-600"
                                : "border-gray-600 bg-[#2a2a2d]"
                            }`}
                          >
                            {isSelected && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>

                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs mr-3">
                            {user.prenoms?.charAt(0)}
                            {user.nom?.charAt(0)}
                          </div>

                          <div className="flex-1">
                            <div className="font-medium">
                              {user.prenoms} {user.nom}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {editedTask.assignees?.length || 0} personne(s) sélectionnée(s)
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Description</h3>
            <textarea
              value={editedTask.description || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 h-32 resize-none"
              placeholder="Ajouter une description..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
