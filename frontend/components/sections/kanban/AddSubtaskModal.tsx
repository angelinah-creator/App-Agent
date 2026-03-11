"use client";

import { useState } from "react";
import { X, Users, Flag, Check } from "lucide-react";
import { CreateSubtaskDto, TaskPriority } from "@/lib/task-service";

interface AddSubtaskModalProps {
  isShared?: boolean;
  assignees?: any[];
  onSubmit: (data: CreateSubtaskDto) => void;
  onCancel: () => void;
}

export default function AddSubtaskModal({
  isShared = false,
  assignees = [],
  onSubmit,
  onCancel,
}: AddSubtaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.NORMALE);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data: CreateSubtaskDto = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
    };

    if (isShared && selectedAssignees.length > 0) {
      data.assignees = selectedAssignees;
    }

    onSubmit(data);
    setTitle("");
    setDescription("");
    setSelectedAssignees([]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
      <div className="bg-[#1a1a1d] rounded-lg w-full max-w-md border border-gray-800 max-h-[85vh] flex flex-col shadow-2xl p-3">
        {/* En-tête */}
        <div className="p-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Titre de la sous-tâche*"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-lg font-semibold focus:outline-none flex-1 w-full placeholder:text-gray-500"
              autoFocus
            />
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-800 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Priorité */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-white mb-1.5 flex items-center gap-1.5 w-18">
              <Flag size={18} className="text-[#6C4EA8]" /> Priorité
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full bg-[#0F0F12] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-purple-500 text-left flex items-center justify-between text-xs"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center">
                    <Flag
                      size={13}
                      className={
                        priority === TaskPriority.URGENTE
                          ? "text-red-500"
                          : priority === TaskPriority.ELEVEE
                          ? "text-orange-500"
                          : priority === TaskPriority.NORMALE
                          ? "text-blue-500"
                          : "text-gray-500"
                      }
                      fill="currentColor"
                    />
                  </div>
                  <span className="capitalize text-xs">{priority}</span>
                </div>
                <svg
                  className={`w-3 h-3 text-white transition-transform ${showPriorityDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPriorityDropdown && (
                <div className="absolute z-[100] bg-[#0F0F12] border border-[#313442] rounded-lg shadow-xl overflow-hidden min-w-full top-full left-0 mt-1">
                  {Object.values(TaskPriority).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="w-full px-2.5 py-1.5 text-left hover:bg-[#3a3a3d] flex items-center gap-2 text-xs"
                      onClick={() => {
                        setPriority(p);
                        setShowPriorityDropdown(false);
                      }}
                    >
                      <div className="w-4 h-4 rounded-full flex items-center justify-center">
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
                      </div>
                      <span className="capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assignations (uniquement pour les tâches partagées) */}
          {isShared && (
            <div>
              <label className="text-xs font-medium text-white mb-1.5 flex items-center gap-1.5 w-22">
                <Users size={18} className="text-[#6C4EA8]" /> Assigné à
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                  className="w-full bg-[#0F0F12] rounded-lg px-2.5 py-1.5 text-left text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAssignees.length > 0 ? (
                          selectedAssignees.map((assigneeId) => {
                            const user = assignees.find((u) => u._id === assigneeId);
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
                          <span className="text-gray-400 text-xs">Sélectionner...</span>
                        )}
                      </div>
                    </div>
                    <svg
                      className={`w-3 h-3 text-white transition-transform ${showAssigneesDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showAssigneesDropdown && (
                  <div className="absolute z-[100] bg-[#0F0F12] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-full top-full left-0 mt-1">
                    {assignees.map((user) => {
                      const isSelected = selectedAssignees.includes(user._id);
                      return (
                        <div
                          key={user._id}
                          className="flex items-center px-2.5 py-1.5 hover:bg-[#3a3a3d] cursor-pointer text-xs"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAssignees(prev => prev.filter(id => id !== user._id));
                            } else {
                              setSelectedAssignees(prev => [...prev, user._id]);
                            }
                          }}
                        >
                          <div
                            className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-purple-600 border-purple-600"
                                : "border-gray-600 bg-[#2a2a2d]"
                            }`}
                          >
                            {isSelected && <Check size={10} className="text-white" />}
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-1 text-[10px] text-gray-500">
                {selectedAssignees.length} personne(s) sélectionnée(s)
              </div>
            </div>
          )}

          {/* Description */}
          {/* <div>
            <label className="text-xs text-white font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0F0F12] rounded-[6px] px-2.5 py-1.5 focus:outline-none focus:border-purple-500 h-24 resize-none text-xs mt-2"
              placeholder="Ajouter une description..."
            />
          </div> */}

          {/* Boutons */}
          <div className="flex gap-2 justify-end mt-5">
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="px-2.5 py-1.5 bg-[#6C4EA8] hover:bg-[#443365] rounded-sm flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer la sous-tâche
            </button>
            <button
              onClick={onCancel}
              className="px-2.5 py-1.5 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-sm transition"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}