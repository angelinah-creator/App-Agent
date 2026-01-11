"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import { X, Calendar, Flag, Users, Briefcase } from "lucide-react";
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
  /* =========================
     STATE MÉTIER (inchangé)
  ========================= */
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: "",
    priority: TaskPriority.NORMALE,
    status: defaultStatus || defaultColumnStatus || TaskStatus.A_FAIRE,
    assignees: isShared ? [] : currentUserId ? [currentUserId] : [],
  });

  /* =========================
     STATE UI (obligatoirement contrôlé)
  ========================= */
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =========================
     SYNC dates → formData
  ========================= */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }));
  }, [startDate, endDate]);

  /* =========================
     Assignation (inchangée)
  ========================= */
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

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    onCancel();
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        ref={popoverRef}
        className="w-full max-w-md bg-[#1c1c1f] border border-[#2a2a2e] rounded-xl shadow-xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2e]">
          <span className="text-sm text-gray-400">Nouvelle tâche</span>
          <button onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-4 py-4 space-y-4">
            {/* TITRE */}
            <input
              autoFocus
              placeholder="Nom de la tâche..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-transparent text-lg font-semibold placeholder:text-gray-500 focus:outline-none"
            />

            {/* ACTIONS CLICKUP */}
            <div className="space-y-3 text-sm text-gray-400">
              {/* ASSIGNÉS (partagé seulement) */}
              {isShared && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenField(openField === "assignee" ? null : "assignee")
                    }
                    className="flex items-center gap-2 hover:text-white"
                  >
                    <Users size={14} />
                    {formData.assignees?.length
                      ? `${formData.assignees.length} assigné(s)`
                      : "Ajouter un assigné"}
                  </button>

                  {openField === "assignee" && (
                    <div className="absolute z-20 mt-2 bg-[#1f1f23] border border-gray-700 rounded-lg p-2 shadow-xl flex flex-wrap gap-2 max-w-xs">
                      {users.map((user) => {
                        const selected = formData.assignees?.includes(user._id);
                        return (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => handleAssigneeChange(user._id)}
                            className={`px-2 py-1 rounded text-xs ${
                              selected
                                ? "bg-purple-600 text-white"
                                : "bg-gray-800 hover:bg-gray-700"
                            }`}
                          >
                            {user.prenoms} {user.nom}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PROJET */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenField(openField === "project" ? null : "project")
                  }
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Briefcase size={14} />
                  {formData.project_id
                    ? projects.find((p) => p._id === formData.project_id)?.name
                    : "Ajouter un projet"}
                </button>

                {openField === "project" && (
                  <div className="absolute z-20 mt-2 bg-[#1f1f23] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {projects.map((project: Project) => (
                      <button
                        key={project._id}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            project_id: project._id,
                          });
                          setOpenField(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PRIORITÉ */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenField(openField === "priority" ? null : "priority")
                  }
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Flag size={14} />
                  <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 text-xs">
                    {formData.priority}
                  </span>
                </button>

                {openField === "priority" && (
                  <div className="absolute z-20 mt-2 bg-[#1f1f23] border border-gray-700 rounded-lg shadow-xl">
                    {Object.values(TaskPriority).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, priority: p });
                          setOpenField(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>


              {/* DATES */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenField(openField === "dates" ? null : "dates")
                  }
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Calendar size={14} />
                  {startDate || endDate
                    ? `${startDate || "—"} → ${endDate || "—"}`
                    : "Ajouter des dates"}
                </button>

                {openField === "dates" && (
                  <div className="absolute z-20 mt-2 bg-[#1f1f23] border border-gray-700 rounded-lg p-3 shadow-xl flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs"
                    />
                    <span className="text-gray-500">→</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a2e]">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-400 hover:text-white"
            >
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
