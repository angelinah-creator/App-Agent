"use client";

import { useState } from "react";
import { X, Users } from "lucide-react";
import { CreateSubtaskDto } from "@/lib/task-service";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data: CreateSubtaskDto = {
      title: title.trim(),
      description: description.trim() || undefined,
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1d] rounded-xl w-full max-w-md border border-gray-700">
        {/* En-tête */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold">Nouvelle sous-tâche</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-800 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Titre */}
          <div>
            <input
              type="text"
              placeholder="Titre de la sous-tâche*"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              autoFocus
            />
          </div>

          {/* Description */}
          {/* <div>
            <textarea
              placeholder="Description (optionnel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 h-20 resize-none"
            />
          </div> */}

          {/* Assignations (uniquement pour les tâches partagées) */}
          {isShared && assignees.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Users size={14} /> Assigner à
              </label>
              <select
                multiple
                value={selectedAssignees}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedAssignees(selected);
                }}
                className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 h-24"
              >
                {assignees.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.prenoms} {user.nom}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500">
                Maintenir Ctrl/Cmd pour sélectionner plusieurs personnes
              </div>
            </div>
          )}

          {/* Informations héritées */}
          {/* <div className="p-3 bg-gray-900/30 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Cette sous-tâche héritera :</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Du projet de la tâche parente</li>
              <li>• De la deadline de la tâche parente</li>
              <li>• Du statut de la tâche parente</li>
              {!isShared && <li>• Sera assignée à vous automatiquement</li>}
            </ul>
          </div> */}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer la sous-tâche
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}