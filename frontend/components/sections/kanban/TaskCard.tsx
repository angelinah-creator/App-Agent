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
    [TaskPriority.URGENTE]: "text-red-300 border-red-500/30",
    [TaskPriority.ELEVEE]: "text-orange-300 border-orange-500/30",
    [TaskPriority.NORMALE]: "text-blue-300 border-blue-500/30",
    [TaskPriority.BASSE]: "text-gray-300 border-gray-500/30",
  };

  const isOverdue = task.end_date && new Date(task.end_date) < new Date();

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      menuRef.current?.contains(e.target as Node) ||
      menuButtonRef.current?.contains(e.target as Node)
    ) {
      return;
    }

    if ((e.target as HTMLElement).closest(".subtask-toggle")) {
      return;
    }

    if ((e.target as HTMLElement).closest(".add-subtask-btn")) {
      return;
    }

    if ((e.target as HTMLElement).closest(".subtask-card")) {
      return;
    }

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
      className={`relative bg-[#141416] border border-gray-800/50 rounded-lg p-2 ${
        isDragDisabled
          ? "cursor-not-allowed opacity-70"
          : "cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-700/50"
      } ${
        isDragging ? "opacity-50 rotate-1 shadow-lg scale-[1.02]" : ""
      } transition-all duration-100 group`}
    >
      {disabled && !isDragging && (
        <div className="absolute inset-0 bg-black/5 rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <Lock size={10} className="text-gray-500" />
        </div>
      )}

      <div className="flex justify-between items-start mb-1.5 pr-5">
        <div className="flex-1">
          <h4 className="font-medium text-xs text-gray-100 line-clamp-2 leading-tight">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>

        <div className="absolute top-1.5 right-1.5">
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragDisabled) {
                setShowMenu(!showMenu);
              }
            }}
            className={`p-0.5 rounded transition-colors ${
              isDragDisabled
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
            disabled={isDragDisabled}
            aria-label="Options"
          >
            <MoreVertical size={12} />
          </button>

          {showMenu && !isDragDisabled && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-0.5 w-36 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task._id);
                  setShowMenu(false);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-[11px] text-gray-300"
              >
                <Edit size={10} />
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task._id);
                  setShowMenu(false);
                }}
                className="w-full px-2.5 py-1.5 text-left hover:bg-red-900/20 text-red-400 transition-colors flex items-center gap-1.5 text-[11px]"
              >
                <Trash2 size={10} />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 flex-wrap">
          <div
            className={`flex items-center gap-0.5 border rounded px-1 py-0.5 text-[10px] ${priorityColors[task.priority]}`}
            title={`Priorité: ${task.priority}`}
          >
            <Flag size={8} />
            <span className="capitalize">{task.priority}</span>
          </div>

          {task.end_date && (
            <div
              className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${
                isOverdue ? "bg-red-900/20 text-red-300" : "text-gray-400"
              }`}
              title={
                isOverdue
                  ? "En retard"
                  : `Échéance: ${format(new Date(task.end_date), "dd/MM/yyyy")}`
              }
            >
              <Calendar size={8} />
              <span>
                {format(new Date(task.end_date), "d MMM", { locale: fr })}
              </span>
              {isOverdue && <Clock size={8} className="ml-0.5" />}
            </div>
          )}

          {task.assignees && task.assignees.length > 0 && (
            <div
              className="flex items-center gap-0.5 text-gray-400 px-1 py-0.5 rounded bg-gray-800/20 text-[10px]"
              title={`${task.assignees.length} personne(s) assignée(s)`}
            >
              <Users size={8} />
              <span>{task.assignees.filter((a) => a).length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex justify-end">
        <button
          onClick={handleAddSubtask}
          className="add-subtask-btn flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-purple-300 transition-colors p-0.5 hover:bg-[#6C4EA810] rounded"
          disabled={isDragDisabled}
          title="Ajouter une sous-tâche"
        >
          <Plus size={9} />
          <span>Sous-tâche</span>
        </button>
      </div>

      {task.sub_tasks && task.sub_tasks.length > 0 && (
        <div className="mt-1.5 border-t border-gray-800/30 pt-1.5">
          <button
            onClick={handleToggleSubtasks}
            className="subtask-toggle w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-gray-300 transition-colors p-0.5 rounded"
            disabled={isDragDisabled}
          >
            <div className="flex items-center gap-1">
              {showSubtasks ? (
                <ChevronDown size={9} />
              ) : (
                <ChevronRight size={9} />
              )}
              <span>{task.sub_tasks.length} sous-tâche(s)</span>
            </div>
            {loadingSubtasks && (
              <div className="w-2 h-2 border-1.5 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>

          {showSubtasks && !loadingSubtasks && (
            <div className="subtask-card mt-1 space-y-0.5">
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
        <div className="mt-1.5">
          <span
            className="px-1 py-0.5 text-[10px] bg-blue-900/20 text-blue-300 rounded inline-flex items-center gap-0.5"
            title={`Projet: ${task.project_id.name}`}
          >
            <svg
              className="w-2 h-2"
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
        <div className="absolute inset-0 border-1 border-purple-500/50 rounded-lg pointer-events-none"></div>
      )}
    </div>
  );
}