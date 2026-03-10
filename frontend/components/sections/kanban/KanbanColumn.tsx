"use client";

import { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  bg: string;
  count: number;
  taskIds: string[]; // IDs des tâches dans cette colonne
  children: ReactNode;
  onAddTask: (status: string) => void;
}

export default function KanbanColumn({
  id,
  title,
  color,
  bg,
  count,
  taskIds,
  children,
  onAddTask,
}: KanbanColumnProps) {
  // La colonne elle-même est droppable
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${id}`, // Préfixe pour distinguer colonne vs tâche
    data: {
      type: "column",
      columnId: id,
    },
  });

  return (
    <div
      className={`flex-shrink-0 w-58 rounded-lg border ${color} ${
        isOver ? "ring-1 ring-purple-500 bg-purple-500/5" : ""
      } transition-all duration-150`}
    >
      {/* En-tête de colonne */}
      <div className={`p-2 rounded-t-lg ${bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(title)}`} />
            <h3 className="font-semibold text-xs text-gray-200">{title}</h3>
            <span className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded-full text-gray-300">
              {count}
            </span>
          </div>
          <button
            onClick={() => onAddTask(id)}
            className="p-0.5 hover:bg-white/5 rounded text-gray-400 hover:text-white"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Zone droppable + liste triable */}
      <div
        ref={setNodeRef}
        className="p-1.5 min-h-[80px] max-h-[calc(100vh-280px)] overflow-y-auto"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {children}
          </div>
        </SortableContext>

        {/* Zone de drop visible quand la colonne est vide */}
        {count === 0 && (
          <div
            className={`flex items-center justify-center h-16 rounded border-2 border-dashed transition-colors ${
              isOver
                ? "border-purple-500/60 bg-purple-500/10 text-purple-400"
                : "border-gray-700/40 text-gray-600"
            }`}
          >
            <span className="text-[10px]">Déposer ici</span>
          </div>
        )}
      </div>

      {/* Pied de colonne */}
      <div className={`p-1.5 rounded-b-lg ${bg}`}>
        <button
          onClick={() => onAddTask(id)}
          className="w-full py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded transition"
        >
          + Ajouter une tâche
        </button>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "À FAIRE": return "bg-gray-500";
    case "EN COURS": return "bg-purple-500";
    case "TERMINÉ": return "bg-green-500";
    case "ANNULÉ": return "bg-red-500";
    default: return "bg-gray-500";
  }
}