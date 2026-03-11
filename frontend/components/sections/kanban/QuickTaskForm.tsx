"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, Flag, Users, Briefcase, Check, ChevronDown } from "lucide-react";
import { CreateTaskDto, TaskPriority, TaskStatus } from "@/lib/task-service";
import { Project } from "@/lib/project-service";

interface QuickTaskFormProps {
  projects: Project[];
  users: any[];
  currentUserId?: string;
  isShared?: boolean;
  defaultStatus?: TaskStatus;
  defaultColumnStatus?: TaskStatus;
  onSubmit: (data: CreateTaskDto) => void;
  onCancel: () => void;
}

export default function QuickTaskForm({
  projects,
  users,
  currentUserId,
  isShared = false,
  defaultStatus,
  defaultColumnStatus,
  onSubmit,
  onCancel,
}: QuickTaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: "",
    priority: TaskPriority.NORMALE,
    status: defaultStatus || defaultColumnStatus || TaskStatus.A_FAIRE,
    assignees: isShared ? [] : currentUserId ? [currentUserId] : [],
  });

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [openField, setOpenField] = useState<
    "assignee" | "dates" | "priority" | "project" | null
  >(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpenField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }));
  }, [startDate, endDate]);

  const handleAssigneeChange = (userId: string) => {
    setFormData((prev) => {
      const current = prev.assignees || [];
      return {
        ...prev,
        assignees: current.includes(userId)
          ? current.filter((id) => id !== userId)
          : [...current, userId],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    onCancel();
  };

  // Affichage compact des assignés sélectionnés (comme dans TaskDetailModal)
  const renderSelectedAssignees = () => {
    if (!formData.assignees || formData.assignees.length === 0) {
      return <span className="text-gray-400 text-xs">Sélectionner...</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {formData.assignees.map((assigneeId) => {
          const user = users.find((u) => u._id === assigneeId);
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
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        ref={popoverRef}
        className="w-full max-w-md bg-[#1a1a1d] border border-gray-800 rounded-lg shadow-2xl"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-medium text-white">Nouvelle tâche</span>
          <button onClick={onCancel} className="p-1 hover:bg-gray-800 rounded-lg">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-4 py-4 space-y-4">
            {/* Titre */}
            <input
              autoFocus
              placeholder="Nom de la tâche..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-transparent text-lg font-semibold text-white placeholder:text-gray-500 focus:outline-none"
            />

            {/* Actions */}
            <div className="space-y-3 text-sm text-gray-400">
              {/* Assignés (uniquement pour tâches partagées) */}
              {isShared && (
                <div className="relative">
                  <label className="text-xs font-medium text-white mb-1.5 flex items-center gap-1.5">
                    <Users size={18} className="text-[#6C4EA8]" /> Assigné à
                  </label>
                  <div>
                    <button
                      type="button"
                      onClick={() => setOpenField(openField === "assignee" ? null : "assignee")}
                      className="w-full bg-[#0F0F12] rounded-lg px-2.5 py-2 text-left text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {renderSelectedAssignees()}
                      </div>
                      <ChevronDown
                        size={12}
                        className={`text-white transition-transform ${openField === "assignee" ? "rotate-180" : ""}`}
                      />
                    </button>

                    {openField === "assignee" && (
                      <div className="absolute z-20 mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-full">
                        {users.map((user) => {
                          const isSelected = formData.assignees?.includes(user._id);
                          return (
                            <div
                              key={user._id}
                              className="flex items-center px-2.5 py-1.5 hover:bg-[#3a3a3d] cursor-pointer text-xs"
                              onClick={() => handleAssigneeChange(user._id)}
                            >
                              {/* Checkbox personnalisée */}
                              <div
                                className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-purple-600 border-purple-600"
                                    : "border-gray-600 bg-[#2a2a2d]"
                                }`}
                              >
                                {isSelected && <Check size={10} className="text-white" />}
                              </div>

                              {/* Avatar */}
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

                              {/* Nom */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {user.prenoms} {user.nom}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-gray-500">
                    {formData.assignees?.length || 0} personne(s) sélectionnée(s)
                  </div>
                </div>
              )}

              {/* Projet */}
              <div className="relative">
                <label className="text-xs font-medium text-white mb-1.5 flex items-center gap-1.5">
                  <Briefcase size={18} className="text-[#6C4EA8]" /> Projet
                </label>
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "project" ? null : "project")}
                  className="w-full bg-[#0F0F12] rounded-lg px-2.5 py-2 text-left text-xs flex items-center justify-between"
                >
                  <span className="text-white">
                    {formData.project_id
                      ? projects.find((p) => p._id === formData.project_id)?.name
                      : "Aucun projet"}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-white transition-transform ${openField === "project" ? "rotate-180" : ""}`}
                  />
                </button>

                {openField === "project" && (
                  <div className="absolute z-20 mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, project_id: undefined });
                        setOpenField(null);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-white"
                    >
                      Aucun projet
                    </button>
                    {projects.map((project) => (
                      <button
                        key={project._id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, project_id: project._id });
                          setOpenField(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-white"
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priorité */}
              <div className="relative">
                <label className="text-xs font-medium text-white mb-1.5 flex items-center gap-1.5">
                  <Flag size={18} className="text-[#6C4EA8]" /> Priorité
                </label>
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "priority" ? null : "priority")}
                  className="w-full bg-[#0F0F12] rounded-lg px-2.5 py-2 text-left text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Flag
                      size={13}
                      className={`${
                        formData.priority === TaskPriority.URGENTE
                          ? "text-red-500"
                          : formData.priority === TaskPriority.ELEVEE
                            ? "text-orange-500"
                            : formData.priority === TaskPriority.NORMALE
                              ? "text-blue-500"
                              : "text-gray-500"
                      }`}
                      fill="currentColor"
                    />
                    <span className="text-white capitalize">{formData.priority}</span>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`text-white transition-transform ${openField === "priority" ? "rotate-180" : ""}`}
                  />
                </button>

                {openField === "priority" && (
                  <div className="absolute z-20 mt-1 bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl min-w-full">
                    {Object.values(TaskPriority).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, priority: p });
                          setOpenField(null);
                        }}
                        className="w-full px-2.5 py-2 text-left hover:bg-[#3a3a3d] flex items-center gap-2 text-xs text-white"
                      >
                        <Flag
                          size={12}
                          fill="currentColor"
                          className={`${
                            p === TaskPriority.URGENTE
                              ? "text-red-500"
                              : p === TaskPriority.ELEVEE
                                ? "text-orange-500"
                                : p === TaskPriority.NORMALE
                                  ? "text-blue-500"
                                  : "text-gray-500"
                          }`}
                        />
                        <span className="capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="relative">
                <label className="text-xs font-medium text-white mb-1.5 flex items-center gap-1.5">
                  <Calendar size={18} className="text-[#6C4EA8]" /> Dates
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 bg-[#0F0F12] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 border border-transparent"
                      placeholder="Début"
                    />
                    <span className="text-gray-500">→</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 bg-[#0F0F12] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 border border-transparent"
                      placeholder="Fin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white text-sm px-5 py-1.5 rounded-md disabled:opacity-50 transition"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}