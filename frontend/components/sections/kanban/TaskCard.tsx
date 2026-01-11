"use client";

import { useState, useRef, useEffect } from "react";
import {
  Users,
  Calendar,
  Flag,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Clock,
  Lock,
  Edit,
  Trash2,
  FileText,
  Plus,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskPriority } from "@/lib/task-service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import SubtaskCard from "./SubtaskCard";

interface TaskCardProps {
  task: Task;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onToggleSubtasks: (taskId: string, show: boolean) => void;
  subtasks?: Task[];
  loadingSubtasks?: boolean;
  disabled?: boolean;
  isSubtasksExpanded?: boolean;
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtasks,
  subtasks = [],
  loadingSubtasks = false,
  disabled = false,
  isSubtasksExpanded = false,
}: TaskCardProps) {
  const [showSubtasks, setShowSubtasks] = useState(isSubtasksExpanded);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShowSubtasks(isSubtasksExpanded);
  }, [isSubtasksExpanded]);

  useEffect(() => {
    if (showSubtasks !== isSubtasksExpanded) {
      onToggleSubtasks(task._id, showSubtasks);
    }
    localStorage.setItem(
      `task_${task._id}_subtasks_expanded`,
      JSON.stringify(showSubtasks)
    );
  }, [showSubtasks, task._id, isSubtasksExpanded, onToggleSubtasks]);

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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: disabled,
  });

  const isDragDisabled = disabled || isDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    [TaskPriority.URGENTE]: "text-red-400 border-red-400",
    [TaskPriority.ELEVEE]: "text-orange-400 border-orange-400",
    [TaskPriority.NORMALE]: "text-blue-400 border-blue-400",
    [TaskPriority.BASSE]: "text-gray-400 border-gray-400",
  };

  const isOverdue = task.end_date && new Date(task.end_date) < new Date();

  const handleCardClick = (e: React.MouseEvent) => {
    // Vérifier si le clic provient du menu ou de ses enfants
    if (
      menuRef.current?.contains(e.target as Node) ||
      menuButtonRef.current?.contains(e.target as Node)
    ) {
      return;
    }

    // Vérifier si le clic provient du chevron de sous-tâches
    if ((e.target as HTMLElement).closest(".subtask-toggle")) {
      return;
    }

    // Vérifier si le clic provient du bouton "Ajouter sous-tâche"
    if ((e.target as HTMLElement).closest(".add-subtask-btn")) {
      return;
    }

    // Vérifier si le clic provient d'une carte de sous-tâche (CORRECTION PRINCIPALE)
    if ((e.target as HTMLElement).closest(".subtask-card")) {
      return;
    }

    // Si aucune condition n'est remplie, ouvrir le modal de la tâche parente
    if (!isDragDisabled) {
      onEdit(task._id);
    }
  };

  const handleToggleSubtasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragDisabled) {
      const newState = !showSubtasks;
      setShowSubtasks(newState);
      onToggleSubtasks(task._id, newState);
    }
  };

  const handleAddSubtask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragDisabled) {
      onAddSubtask(task._id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`relative bg-[#141416] border border-gray-800 rounded-lg p-4 ${
        isDragDisabled
          ? "cursor-not-allowed opacity-80"
          : "cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-gray-700"
      } ${
        isDragging ? "opacity-60 rotate-1 shadow-xl scale-105" : ""
      } transition-all duration-150 group`}
    >
      {disabled && !isDragging && (
        <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <Lock size={14} className="text-gray-500" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3 pr-8">
        <div className="flex-1">
          <h4 className="font-medium text-sm leading-tight text-gray-100">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragDisabled) {
                setShowMenu(!showMenu);
              }
            }}
            className={`p-1.5 rounded transition-colors ${
              isDragDisabled
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
            disabled={isDragDisabled}
            aria-label="Options"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && !isDragDisabled && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-1 w-48 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task._id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm text-gray-300"
              >
                <Edit size={14} />
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubtask(task._id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-purple-900/30 transition-colors flex items-center gap-2 text-sm text-purple-300"
              >
                <Plus size={14} />
                Ajouter une sous-tâche
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task._id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-red-900/30 text-red-400 transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-1 border rounded px-1.5 py-0.5 ${
              priorityColors[task.priority]
            }`}
            title={`Priorité: ${task.priority}`}
          >
            <Flag
              size={10}
              className={priorityColors[task.priority].split(" ")[0]}
            />
            <span className="capitalize text-xs">{task.priority}</span>
          </div>

          {task.end_date && (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                isOverdue ? "bg-red-900/30 text-red-300" : "text-gray-400"
              }`}
              title={
                isOverdue
                  ? "En retard"
                  : `Échéance: ${format(new Date(task.end_date), "dd/MM/yyyy")}`
              }
            >
              <Calendar size={10} />
              <span>
                {format(new Date(task.end_date), "d MMM", { locale: fr })}
              </span>
              {isOverdue && <Clock size={10} className="ml-0.5" />}
            </div>
          )}

          {task.assignees && task.assignees.length > 0 && (
            <div
              className="flex items-center gap-1 text-gray-400 px-1.5 py-0.5 rounded bg-gray-800/30"
              title={`${task.assignees.length} personne(s) assignée(s)`}
            >
              <Users size={10} />
              <span>{task.assignees.filter((a) => a).length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleAddSubtask}
          className="add-subtask-btn flex items-center gap-1 text-xs text-gray-400 hover:text-purple-300 transition-colors p-1 hover:bg-[#6C4EA821] rounded"
          disabled={isDragDisabled}
          title="Ajouter une sous-tâche"
        >
          <Plus size={12} />
          <span>Sous-tâche</span>
        </button>
      </div>

      {task.sub_tasks && task.sub_tasks.length > 0 && (
        <div className="mt-4 border-t border-gray-800/50 pt-3">
          <button
            onClick={handleToggleSubtasks}
            className="subtask-toggle w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-300 transition-colors p-1 rounded"
            disabled={isDragDisabled}
          >
            <div className="flex items-center gap-2">
              {showSubtasks ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              <span>{task.sub_tasks.length} sous-tâche(s)</span>
            </div>
            {loadingSubtasks && (
              <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>

          {/* CORRECTION: Ajouter la classe subtask-card au conteneur */}
          {showSubtasks && !loadingSubtasks && (
            <div className="subtask-card mt-2 space-y-1">
              {subtasks.map((subtask) => (
                <SubtaskCard
                  key={subtask._id}
                  task={subtask}
                  onEdit={() => onEdit(subtask._id)}
                  onDelete={() => onDelete(subtask._id)}
                  disabled={isDragDisabled}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {task.project_id && (
        <div className="mt-3">
          <span
            className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded inline-flex items-center gap-1"
            title={`Projet: ${task.project_id.name}`}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            {task.project_id.name}
          </span>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 border-2 border-purple-500 rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
}
