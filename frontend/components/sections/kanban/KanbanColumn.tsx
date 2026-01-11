"use client";

import { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  bg: string;
  count: number;
  children: ReactNode;
  onAddTask: (status: string) => void;
}

export default function KanbanColumn({
  id,
  title,
  color,
  bg,
  count,
  children,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ 
    id,
    data: {
      type: 'column',
      accepts: ['task']
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-xl border ${color} ${isOver ? "ring-2 ring-purple-500 bg-purple-500/10" : ""}`}
    >
      {/* En-tête de colonne */}
      <div className={`p-4 rounded-t-xl ${bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(title)}`} />
            <h3 className="font-semibold">{title}</h3>
            <span className="px-2 py-1 text-xs bg-black/30 rounded-full">
              {count}
            </span>
          </div>
          <button
            onClick={() => onAddTask(id)}
            className="p-1 hover:bg-white/10 rounded"
            title="Ajouter une tâche"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {children}
      </div>

      {/* Pied de colonne */}
      <div className={`p-3 rounded-b-xl ${bg}`}>
        <button
          onClick={() => onAddTask(id)}
          className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
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