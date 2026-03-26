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
  Plus,
} from "lucide-react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskDto,
} from "@/lib/task-service";
import { Project } from "@/lib/project-service";
import { formatDateToInput } from "@/lib/utils";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";

interface TaskDetailModalProps {
  task: Task;
  projects: Project[];
  users: any[];
  onUpdate: (taskId: string, data: UpdateTaskDto) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  subtasks?: Task[];
  onAddSubtask?: (data: { title: string; priority: TaskPriority; assignees?: string[] }) => void;
  onUpdateSubtask?: (subtaskId: string, data: UpdateTaskDto) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  isPersonal?: boolean;
}
export default function TaskDetailModal({
  task,
  projects,
  users,
  onUpdate,
  onDelete,
  onClose,
  subtasks = [],
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onEditSubtask,
  isPersonal = false,
}: TaskDetailModalProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<TaskPriority>(TaskPriority.NORMALE);
  const [newSubtaskAssignees, setNewSubtaskAssignees] = useState<string[]>([]);
  const [showSubtaskAssigneesDropdown, setShowSubtaskAssigneesDropdown] = useState(false);
  const subtaskAssigneesRef = useRef<HTMLDivElement>(null);
  const [editedTask, setEditedTask] = useState<UpdateTaskDto>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    project_id: task.project_id?._id,
    assignees: task.assignees?.map((a) => a._id) || [],
    start_date: formatDateToInput(task.start_date),
    end_date: formatDateToInput(task.end_date),
  });

  const [startDate, setStartDate] = useState<string>(
    formatDateToInput(task.start_date),
  );
  const [endDate, setEndDate] = useState<string>(
    formatDateToInput(task.end_date),
  );

  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        showSubtaskAssigneesDropdown &&
        subtaskAssigneesRef.current &&
        !subtaskAssigneesRef.current.contains(event.target as Node)
      ) {
        setShowSubtaskAssigneesDropdown(false);
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
    // Transformer les chaînes vides en null pour le backend (suppression de date)
    const taskToSave = {
      ...editedTask,
      start_date: editedTask.start_date === "" ? null : editedTask.start_date,
      end_date: editedTask.end_date === "" ? null : editedTask.end_date,
    };
    onUpdate(task._id, taskToSave as UpdateTaskDto);
    onClose();
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    onDelete(task._id);
    setIsDeleteModalOpen(false);
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

          {/* Sous-tâches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white font-medium flex items-center gap-1.5">
                <Check size={18} className="text-[#6C4EA8]" /> Sous-tâches ({subtasks.length})
              </label>
            </div>

            {/* Quick Add Subtask */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubtaskTitle.trim()) {
                      onAddSubtask?.({
                        title: newSubtaskTitle.trim(),
                        priority: newSubtaskPriority,
                        assignees: newSubtaskAssignees,
                      });
                      setNewSubtaskTitle("");
                      setNewSubtaskPriority(TaskPriority.NORMALE);
                      setNewSubtaskAssignees([]);
                    }
                  }}
                  placeholder="Ajouter une sous-tâche..."
                  className="flex-1 bg-[#0F0F12] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 border border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSubtaskTitle.trim()) {
                      onAddSubtask?.({
                        title: newSubtaskTitle.trim(),
                        priority: newSubtaskPriority,
                        assignees: newSubtaskAssignees,
                      });
                      setNewSubtaskTitle("");
                      setNewSubtaskPriority(TaskPriority.NORMALE);
                      setNewSubtaskAssignees([]);
                    }
                  }}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-xs transition disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex items-center gap-4 px-1">
                {/* Priority Selector for Subtask */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Priorité:</span>
                  <div className="flex gap-1">
                    {Object.values(TaskPriority).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewSubtaskPriority(p)}
                        className={`p-1 rounded transition ${
                          newSubtaskPriority === p ? "bg-gray-700" : "hover:bg-gray-800"
                        }`}
                        title={p}
                      >
                        <Flag
                          size={12}
                          fill="currentColor"
                          className={
                            p === TaskPriority.URGENTE
                              ? "text-red-500"
                              : p === TaskPriority.ELEVEE
                                ? "text-orange-500"
                                : p === TaskPriority.NORMALE
                                  ? "text-blue-500"
                                  : "text-gray-500"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignees Selector for Subtask (Shared only) */}
                {!isPersonal && (
                  <div className="flex items-center gap-2 relative" ref={subtaskAssigneesRef}>
                    <span className="text-[10px] text-gray-500">Assigner:</span>
                    <button
                      onClick={() => setShowSubtaskAssigneesDropdown(!showSubtaskAssigneesDropdown)}
                      className="flex items-center gap-1 bg-[#0F0F12] rounded px-1.5 py-0.5 text-[10px] text-gray-300 hover:bg-gray-800 transition"
                    >
                      <Plus size={10} />
                      {newSubtaskAssignees.length > 0
                        ? `${newSubtaskAssignees.length}`
                        : "Personne"}
                    </button>

                    {showSubtaskAssigneesDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 z-30 bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl min-w-[150px] max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {users.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => {
                              setNewSubtaskAssignees((prev) =>
                                prev.includes(user._id)
                                  ? prev.filter((id) => id !== user._id)
                                  : [...prev, user._id]
                              );
                            }}
                            className="w-full px-2 py-1.5 text-left hover:bg-[#3a3a3d] rounded flex items-center justify-between gap-2 text-[10px] text-white"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {user.profilePhoto?.url ? (
                                <img
                                  src={user.profilePhoto.url}
                                  alt={`${user.prenoms} ${user.nom}`}
                                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-[8px]">
                                  {user.prenoms?.[0] || user.email?.[0]}
                                </div>
                              )}
                              <span className="truncate">{user.prenoms} {user.nom}</span>
                            </div>
                            {newSubtaskAssignees.includes(user._id) && (
                              <Check size={10} className="text-purple-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks List */}
            {subtasks.length > 0 && (
              <div className="space-y-1 bg-[#0F0F12]/50 rounded-lg p-2 max-h-48 overflow-y-auto custom-scrollbar">
                {subtasks.map((st) => (
                  <div
                    key={st._id}
                    className="flex items-center justify-between gap-2 p-2 rounded bg-[#0F0F12] group hover:bg-[#1a1a1d] transition"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() =>
                          onUpdateSubtask?.(st._id, {
                            status:
                              st.status === TaskStatus.TERMINEE
                                ? TaskStatus.A_FAIRE
                                : TaskStatus.TERMINEE,
                          })
                        }
                        className={`w-4 h-4 rounded border flex items-center justify-center transition flex-shrink-0 ${
                          st.status === TaskStatus.TERMINEE
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-gray-600 hover:border-purple-500"
                        }`}
                      >
                        {st.status === TaskStatus.TERMINEE && <Check size={10} />}
                      </button>
                      
                      {/* Subtask Priority Icon in List */}
                      <Flag
                        size={10}
                        fill="currentColor"
                        className={`flex-shrink-0 ${
                          st.priority === TaskPriority.URGENTE
                            ? "text-red-500"
                            : st.priority === TaskPriority.ELEVEE
                              ? "text-orange-500"
                              : st.priority === TaskPriority.NORMALE
                                ? "text-blue-500"
                                : "text-gray-500"
                        }`}
                      />

                      <span
                        onClick={() => onEditSubtask?.(st)}
                        className={`text-xs cursor-pointer truncate hover:text-purple-400 transition flex-1 ${
                          st.status === TaskStatus.TERMINEE
                            ? "line-through text-gray-500"
                            : "text-gray-200"
                        }`}
                      >
                        {st.title}
                      </span>

                      {/* Subtask Assignees Avatars in List */}
                      {!isPersonal && st.assignees && st.assignees.length > 0 && (
                        <div className="flex -space-x-1 items-center flex-shrink-0 ml-2">
                          {st.assignees.slice(0, 3).map((v: any, i: number) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-[#0F0F12] bg-purple-600 flex items-center justify-center text-[8px] text-white overflow-hidden"
                              title={`${v.prenoms} ${v.nom}`}
                            >
                              {v.profilePhoto?.url ? (
                                <img
                                  src={v.profilePhoto.url}
                                  alt={`${v.prenoms} ${v.nom}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{v.prenoms?.[0] || v.email?.[0]}</span>
                              )}
                            </div>
                          ))}
                          {st.assignees.length > 3 && (
                            <div className="w-4 h-4 rounded-full border border-[#0F0F12] bg-gray-700 flex items-center justify-center text-[8px] text-white">
                              +{st.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onDeleteSubtask?.(st._id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
