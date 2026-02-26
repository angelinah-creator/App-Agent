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
    task.start_date || new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    task.end_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
  );

  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneesRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

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
      if (
        showProjectDropdown &&
        projectRef.current &&
        !projectRef.current.contains(event.target as Node)
      ) {
        setShowProjectDropdown(false);
      }
      if (
        showStatusDropdown &&
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    showPriorityDropdown,
    showAssigneesDropdown,
    showProjectDropdown,
    showStatusDropdown,
  ]);

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
      {/* Container principal - plus petit et compact */}
      <div className="bg-[#1a1a1d] rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl p-3">
        {/* En-tête - ultra compact */}
        <div className="p-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) =>
                setEditedTask({ ...editedTask, title: e.target.value })
              }
              className="bg-transparent text-lg font-semibold focus:outline-none flex-1 w-xl"
              autoFocus
              placeholder="Titre de la tâche"
            />
            {isSubtask && (
              <span className="text-[10px] text-white font-medium px-1.5 py-0.5 bg-gray-800/30 rounded">
                Sous-tâche
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenu scrollable - compact */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Métadonnées en grille compacte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Priorité */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-white mb-1.5 flex items-center gap-1.5 w-18">
                <Flag size={18} className="text-[#6C4EA8]" /> Priorité
              </label>
              <div className="relative" ref={priorityRef}>
                <button
                  type="button"
                  className="w-full bg-[#0F0F12] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-purple-500 text-left flex items-center justify-between text-xs"
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center">
                      <Flag
                        size={13}
                        className={`${
                          editedTask.priority === TaskPriority.URGENTE
                            ? "text-red-500"
                            : editedTask.priority === TaskPriority.ELEVEE
                              ? "text-orange-500"
                              : editedTask.priority === TaskPriority.NORMALE
                                ? "text-blue-500"
                                : "text-gray-500"
                        }`}
                        fill="currentColor"
                      />
                    </div>
                    <span className="capitalize text-xs">
                      {editedTask.priority}
                    </span>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`text-white font-bold ml-2 transition-transform ${
                      showPriorityDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showPriorityDropdown && (
                  <div className="absolute z-[100] bg-[#0F0F12] border border-[#313442] rounded-lg shadow-xl overflow-hidden min-w-full top-full left-0 mt-1">
                    {Object.values(TaskPriority).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        className="w-full px-2.5 py-1.5 text-left hover:bg-[#3a3a3d] flex items-center gap-2 text-xs"
                        onClick={() => {
                          setEditedTask({ ...editedTask, priority });
                          setShowPriorityDropdown(false);
                        }}
                      >
                        <div className="w-4 h-4 rounded-full flex items-center justify-center">
                          <Flag
                            size={12}
                            fill="currentColor"
                            className={`${
                              priority === TaskPriority.URGENTE
                                ? "text-red-500"
                                : priority === TaskPriority.ELEVEE
                                  ? "text-orange-500"
                                  : priority === TaskPriority.NORMALE
                                    ? "text-blue-500"
                                    : "text-gray-500"
                            }`}
                          />
                        </div>
                        <span className="capitalize">{priority}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Statut */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-white font-medium mb-1.5 flex items-center gap-1.5 w-18">
                <Tag size={18} className="text-[#6C4EA8]" /> Statut
              </label>

              <div className="relative w-24" ref={statusRef}>
                <button
                  type="button"
                  className="w-full bg-[#0F0F12] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-purple-500 text-left flex items-center justify-between text-xs"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  <span className="capitalize text-xs">
                    {editedTask.status}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-white transition-transform ml-2 ${showStatusDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showStatusDropdown && (
                  <div className="absolute z-[100] bg-[#0F0F12] border border-[#313442] rounded-lg shadow-xl overflow-hidden min-w-full top-full left-0 mt-1">
                    {Object.values(TaskStatus).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="w-full px-2.5 py-1.5 text-left hover:bg-[#3a3a3d] flex items-center gap-2 text-xs"
                        onClick={() => {
                          setEditedTask({ ...editedTask, status });
                          setShowStatusDropdown(false);
                        }}
                      >
                        <span className="capitalize">{status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Projet */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-white font-medium mb-1.5 flex items-center gap-1.5 w-18">
                <Briefcase size={18} className="text-[#6C4EA8]" /> Projet
              </label>

              <div className="relative" ref={projectRef}>
                <button
                  type="button"
                  className="w-full bg-[#0F0F12] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-purple-500 text-left flex items-center justify-between text-xs"
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                >
                  <span className="text-xs truncate">
                    {projects.find((p) => p._id === editedTask.project_id)
                      ?.name || "Aucun projet"}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-white transition-transform ml-2 ${showProjectDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showProjectDropdown && (
                  <div className="absolute z-[100] bg-[#0F0F12] border border-[#313442] rounded-lg shadow-xl overflow-hidden min-w-full top-full left-0 mt-1">
                    <button
                      type="button"
                      className="w-full px-2.5 py-1.5 text-left hover:bg-[#3a3a3d] text-xs"
                      onClick={() => {
                        setEditedTask({ ...editedTask, project_id: undefined });
                        setShowProjectDropdown(false);
                      }}
                    >
                      Aucun projet
                    </button>
                    {projects.map((project) => (
                      <button
                        key={project._id}
                        type="button"
                        className="w-full px-2.5 py-1.5 text-left hover:bg-[#3a3a3d] flex items-center gap-2 text-xs"
                        onClick={() => {
                          setEditedTask({
                            ...editedTask,
                            project_id: project._id,
                          });
                          setShowProjectDropdown(false);
                        }}
                      >
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isSubtask && task.project_id && (
                <div className="text-[10px] text-gray-500 mt-0.5">
                  (hérité de la tâche parente)
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-white font-medium mb-1.5 flex items-center gap-1.5 w-18">
                <Calendar size={18} className="text-[#6C4EA8]" /> Dates
              </label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-gray-500 w-11">
                    Début:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-[#0F0F12] rounded-[6px] px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-gray-500 w-11">
                    Echéance:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="flex-1 bg-[#0F0F12] rounded-[6px] px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignations (uniquement pour les tâches partagées) */}
          {!isPersonal && (
            <div>
              <label className="text-xs text-white font-medium mb-1.5 flex items-center gap-1.5">
                <Users size={18} className="text-[#6C4EA8]" /> Assigné à
              </label>

              <div className="relative" ref={assigneesRef}>
                <button
                  type="button"
                  onClick={() =>
                    setShowAssigneesDropdown(!showAssigneesDropdown)
                  }
                  className="w-full bg-[#0F0F12] rounded-lg px-2.5 py-1.5 text-left text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {editedTask.assignees &&
                        editedTask.assignees.length > 0 ? (
                          editedTask.assignees.map((assigneeId) => {
                            const user = users.find(
                              (u) => u._id === assigneeId,
                            );
                            if (!user) return null;
                            return (
                              <div
                                key={user._id}
                                className="flex items-center gap-1 bg-[#1a1a1d] rounded-full pl-0.5 pr-2 py-0.5"
                                title={`${user.prenoms} ${user.nom}`}
                              >
                                {user.profilePhoto?.url ? (
                                  <img
                                    src={user.profilePhoto.url}
                                    alt={`${user.prenoms} ${user.nom}`}
                                    className="w-7 h-7 rounded-full object-cover border border-gray-700"
                                  />
                                ) : (
                                  <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-[10px] border border-gray-700">
                                    {user.prenoms?.charAt(0)}
                                    {user.nom?.charAt(0)}
                                  </div>
                                )}
                                <span className="text-[10px] font-medium whitespace-nowrap">
                                  {user.prenoms}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-white font-medium text-xs">
                            Sélectionner...
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      size={12}
                      className={`text-white font-medium transition-transform ${
                        showAssigneesDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {showAssigneesDropdown && (
                  <div className="absolute z-[100] bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-full top-full left-0 mt-1">
                    {users.map((user) => {
                      const isSelected = editedTask.assignees?.includes(
                        user._id,
                      );
                      return (
                        <div
                          key={user._id}
                          className="flex items-center px-2.5 py-1.5 hover:bg-[#3a3a3d] cursor-pointer text-xs"
                          onClick={() => {
                            const currentAssignees = editedTask.assignees || [];
                            let newAssignees: string[];

                            if (isSelected) {
                              newAssignees = currentAssignees.filter(
                                (id) => id !== user._id,
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
                            className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-purple-600 border-purple-600"
                                : "border-gray-600 bg-[#2a2a2d]"
                            }`}
                          >
                            {isSelected && (
                              <Check size={10} className="text-white" />
                            )}
                          </div>

                          {user.profilePhoto?.url ? (
                            <img
                              src={user.profilePhoto.url}
                              alt={`${user.prenoms} ${user.nom}`}
                              className="w-7 h-7 rounded-full object-cover mr-2"
                            />
                          ) : (
                            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-[10px] mr-2">
                              {user.prenoms?.charAt(0)}
                              {user.nom?.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {user.prenoms} {user.nom}
                            </div>
                            {/* <div className="text-[10px] text-white font-medium truncate">
                              {user.email}
                            </div> */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-1 text-[10px] text-gray-500">
                {editedTask.assignees?.length || 0} personne(s) sélectionnée(s)
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs text-white font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={editedTask.description || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              className="w-full bg-[#0F0F12] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-purple-500 h-24 resize-none text-xs mt-2"
              placeholder="Ajouter une description..."
            />
          </div>

          <div className="flex gap-2 justify-end mt-5">
            <button
              onClick={handleSave}
              className="px-2.5 py-1.5 bg-[#6C4EA8] hover:bg-[#443365] rounded-sm flex items-center gap-1.5 text-xs"
              title="Enregistrer"
            >
              <Save size={12} />
              <span className="hidden sm:inline">Enregistrer</span>
            </button>
            <button
              onClick={handleDelete}
              className="px-2.5 py-1.5 bg-red-500 hover:bg-red-400 rounded-sm flex items-center gap-1.5 text-xs"
              title="Supprimer"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
