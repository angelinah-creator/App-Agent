"use client";

import { useState, useRef, useEffect } from "react";
import { Flag, Calendar, Users, Edit, Trash2, MoreVertical } from "lucide-react";
import { Task, TaskPriority } from "@/lib/task-service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SubtaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export default function SubtaskCard({
  task,
  onEdit,
  onDelete,
  disabled = false,
}: SubtaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const priorityColors = {
    [TaskPriority.URGENTE]: "text-red-400 border-red-400",
    [TaskPriority.ELEVEE]: "text-orange-400 border-orange-400",
    [TaskPriority.NORMALE]: "text-blue-400 border-blue-400",
    [TaskPriority.BASSE]: "text-gray-400 border-gray-400",
  };

  // IMPORTANT: Empêcher la propagation du clic vers la carte parente
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation
    if (!disabled && !showMenu) {
      onEdit();
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation
    if (!disabled) {
      setShowMenu(!showMenu);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative bg-[#1a1a1d] border border-gray-700/50 rounded p-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#1f1f22] hover:border-purple-500/30"
      } transition-all`}
    >
      {/* En-tête */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-6">
          <h5 className="text-xs font-medium text-gray-200 leading-tight">
            {task.title}
          </h5>
        </div>

        {/* Menu déroulant */}
        <div className="absolute top-2 right-2">
          <button
            ref={menuButtonRef}
            onClick={handleMenuToggle}
            className={`p-1 rounded transition-colors ${
              disabled
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            disabled={disabled}
            aria-label="Options"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && !disabled && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-1 w-40 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-800 transition-colors flex items-center gap-2 text-xs text-gray-300"
              >
                <Edit size={12} />
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-red-900/30 text-red-400 transition-colors flex items-center gap-2 text-xs"
              >
                <Trash2 size={12} />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Métadonnées */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Priorité */}
        <div
          className={`flex items-center gap-1 border rounded px-1.5 py-0.5 ${
            priorityColors[task.priority]
          }`}
        >
          <Flag size={8} />
          <span className="text-xs">{task.priority}</span>
        </div>

        {/* Assignations */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-1 text-gray-400 px-1.5 py-0.5 rounded bg-gray-800/30">
            <Users size={8} />
            <span>{task.assignees.filter((a) => a).length}</span>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
          {task.description}
        </p>
      )}
    </div>
  );
}