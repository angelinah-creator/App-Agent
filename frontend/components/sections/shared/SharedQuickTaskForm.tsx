"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Calendar, Flag, Users, Briefcase, ChevronDown, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CreateTaskDto, TaskPriority, TaskStatus } from "@/lib/task-service";
import { Project } from "@/lib/project-service";
import { spaceService } from "@/lib/space-service";

interface SharedQuickTaskFormProps {
  spaceId: string;
  projects: Project[];
  currentUserId?: string;
  defaultStatus?: TaskStatus;
  defaultColumnStatus?: TaskStatus;
  onSubmit: (data: CreateTaskDto) => void;
  onCancel: () => void;
}

export default function SharedQuickTaskForm({
  spaceId,
  projects,
  currentUserId,
  defaultStatus,
  defaultColumnStatus,
  onSubmit,
  onCancel,
}: SharedQuickTaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: "",
    priority: TaskPriority.NORMALE,
    status: defaultStatus || defaultColumnStatus || TaskStatus.A_FAIRE,
    assignees: [], // pour une tâche partagée, on commence sans assigné
  });

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [openField, setOpenField] = useState<"assignee" | "dates" | "priority" | "project" | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Récupérer les membres de l'espace
  const { data: spacePermissions, isLoading: loadingMembers } = useQuery({
    queryKey: ['spaceMembers', spaceId],
    queryFn: () => spaceService.getPermissions(spaceId),
    enabled: !!spaceId,
  });

  // Transformer les permissions en liste d'utilisateurs
  const spaceMembers = useMemo(() => {
    return (spacePermissions || []).map(p => p.userId);
  }, [spacePermissions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div ref={popoverRef} className="w-full max-w-md bg-[#1a1a1d] border border-gray-800 rounded-xl shadow-xl">
        {/* En-tête */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm text-gray-400">Nouvelle tâche partagée</span>
          <button onClick={onCancel} className="p-1 hover:bg-gray-800 rounded-lg">
            <X size={18} />
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
              className="w-full bg-transparent text-lg font-semibold placeholder:text-gray-500 focus:outline-none"
            />

            {/* Actions */}
            <div className="space-y-3 text-sm text-gray-400">
              {/* Assignés */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "assignee" ? null : "assignee")}
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Users size={16} className="text-[#6C4EA8]" />
                  {formData.assignees?.length
                    ? `${formData.assignees.length} assigné(s)`
                    : "Ajouter un assigné"}
                </button>

                {openField === "assignee" && (
                  <div className="absolute z-20 mt-2 bg-[#0F0F12] border border-gray-700 rounded-lg p-2 shadow-xl max-h-48 overflow-y-auto min-w-[220px]">
                    {loadingMembers ? (
                      <div className="text-center text-gray-400 text-xs py-2">Chargement...</div>
                    ) : spaceMembers.length === 0 ? (
                      <div className="text-center text-gray-400 text-xs py-2">Aucun membre dans cet espace</div>
                    ) : (
                      spaceMembers.map((user) => {
                        const selected = formData.assignees?.includes(user._id);
                        return (
                          <div
                            key={user._id}
                            className="flex items-center px-2 py-1.5 hover:bg-[#3a3a3d] cursor-pointer rounded"
                            onClick={() => handleAssigneeChange(user._id)}
                          >
                            <div
                              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                                selected
                                  ? "bg-purple-600 border-purple-600"
                                  : "border-gray-600 bg-[#2a2a2d]"
                              }`}
                            >
                              {selected && <Check size={10} className="text-white" />}
                            </div>
                            {user.profilePhoto?.url ? (
                              <img
                                src={user.profilePhoto.url}
                                alt={`${user.prenoms} ${user.nom}`}
                                className="w-6 h-6 rounded-full object-cover mr-2"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-[10px] mr-2">
                                {user.prenoms?.charAt(0)}{user.nom?.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs">{user.prenoms} {user.nom}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Projet */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "project" ? null : "project")}
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Briefcase size={16} className="text-[#6C4EA8]" />
                  {formData.project_id
                    ? projects.find((p) => p._id === formData.project_id)?.name
                    : "Ajouter un projet"}
                </button>

                {openField === "project" && (
                  <div className="absolute z-20 mt-2 bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-[180px]">
                    {projects.map((project: Project) => (
                      <button
                        key={project._id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, project_id: project._id });
                          setOpenField(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-[#3a3a3d]"
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priorité */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "priority" ? null : "priority")}
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Flag size={16} className="text-[#6C4EA8]" />
                  <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-xs">
                    {formData.priority}
                  </span>
                </button>

                {openField === "priority" && (
                  <div className="absolute z-20 mt-2 bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl min-w-[140px]">
                    {Object.values(TaskPriority).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, priority: p });
                          setOpenField(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-[#3a3a3d]"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "dates" ? null : "dates")}
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Calendar size={16} className="text-[#6C4EA8]" />
                  {startDate || endDate
                    ? `${startDate || "—"} → ${endDate || "—"}`
                    : "Ajouter des dates"}
                </button>

                {openField === "dates" && (
                  <div className="absolute z-20 mt-2 bg-[#0F0F12] border border-gray-700 rounded-lg p-3 shadow-xl flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs w-28"
                    />
                    <span className="text-gray-500">→</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs w-28"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-white">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white text-sm px-4 py-1.5 rounded-md disabled:opacity-50"
            >
              Enregistrer ↵
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}