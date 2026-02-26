"use client";

import { Flag } from "lucide-react";
import { TaskPriority } from "@/lib/task-service";

interface PriorityFilterProps {
  selectedPriority: TaskPriority | "all";
  onPriorityChange: (priority: TaskPriority | "all") => void;
}

export default function PriorityFilter({
  selectedPriority,
  onPriorityChange,
}: PriorityFilterProps) {
  return (
    <div className="relative">
      <select
        value={selectedPriority}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "all")}
        className="appearance-none pl-8 pr-6 py-1.5 bg-[#2a2a2d] border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer text-xs h-9 w-full"
      >
        <option value="all">Toutes les priorités</option>
        {Object.values(TaskPriority).map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>
      <Flag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" size={12} />
      <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}