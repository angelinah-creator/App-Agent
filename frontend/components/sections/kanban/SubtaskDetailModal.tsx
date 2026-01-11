"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Users,
  Flag,
  Save,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus, UpdateTaskDto } from "@/lib/task-service";

interface SubtaskDetailModalProps {
  task: Task;
  users: any[];
  onUpdate: (taskId: string, data: UpdateTaskDto) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  isShared?: boolean;
}

export default function SubtaskDetailModal({
  task,
  users,
  onUpdate,
  onDelete,
  onClose,
  isShared = false,
}: SubtaskDetailModalProps) {
  const [editedTask, setEditedTask] = useState<UpdateTaskDto>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    assignees: task.assignees?.map(a => a._id) || [],
    start_date: task.start_date,
    end_date: task.end_date,
  });

  const [startDate, setStartDate] = useState<string>(
    task.start_date || ""
  );
  const [endDate, setEndDate] = useState<string>(
    task.end_date || ""
  );

  const [showAssigneesDropdown, setShowAssigneesDropdown] = useState(false);
  const assigneesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedTask(prev => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  }, [startDate, endDate]);

  // Fermer le menu déroulant quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAssigneesDropdown && 
        assigneesRef.current && 
        !assigneesRef.current.contains(event.target as Node)
      ) {
        setShowAssigneesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAssigneesDropdown]);

  const handleSave = () => {
    onUpdate(task._id, editedTask);
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Supprimer cette sous-tâche ?")) {
      onDelete(task._id);
    }
  };

  const toggleAssignee = (userId: string) => {
    setEditedTask(prev => {
      const currentAssignees = prev.assignees || [];
      if (currentAssignees.includes(userId)) {
        return {
          ...prev,
          assignees: currentAssignees.filter(id => id !== userId),
        };
      } else {
        return {
          ...prev,
          assignees: [...currentAssignees, userId],
        };
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      {/* Container principal avec flex column */}
      <div className="bg-[#1a1a1d] rounded-sm w-full max-w-4xl border border-gray-700 max-h-[90vh] flex flex-col">
        {/* En-tête - fixe */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="bg-transparent text-xl font-semibold border-b border-gray-600 focus:outline-none focus:border-purple-500"
              autoFocus
              placeholder="Titre de la sous-tâche"
            />
            <span className="text-xs text-purple-400">Sous-tâche</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
              {isShared ? "partagée" : "personnelle"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
              title="Enregistrer"
            >
              <Save size={18} /> Enregistrer
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg flex items-center gap-2"
              title="Supprimer"
            >
              <Trash2 size={18} /> Supprimer
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenu - scrollable avec position relative */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 relative">
          {/* Priorité */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
              <Flag size={14} /> Priorité
            </h3>
            <select
              value={editedTask.priority}
              onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })}
              className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              {Object.values(TaskPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Assignations - UNIQUEMENT pour les tâches partagées */}
          {isShared && (
            <div>
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Users size={14} /> Assigné à
              </h3>
              
              {/* Bouton d'ouverture du menu */}
              <div className="relative" ref={assigneesRef}>
                <button
                  type="button"
                  onClick={() => setShowAssigneesDropdown(!showAssigneesDropdown)}
                  className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 text-left focus:outline-none focus:border-purple-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {editedTask.assignees && editedTask.assignees.length > 0 ? (
                          <>
                            {editedTask.assignees.slice(0, 3).map((assigneeId) => {
                              const user = users.find(u => u._id === assigneeId);
                              if (!user) return null;
                              return (
                                <div
                                  key={user._id}
                                  className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs border-2 border-[#2a2a2d]"
                                  title={`${user.prenoms} ${user.nom}`}
                                >
                                  {user.prenoms?.charAt(0)}{user.nom?.charAt(0)}
                                </div>
                              );
                            })}
                            {editedTask.assignees.length > 3 && (
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs border-2 border-[#2a2a2d]">
                                +{editedTask.assignees.length - 3}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">Sélectionner des personnes...</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAssigneesDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Menu déroulant avec position fixed */}
                {showAssigneesDropdown && (
                  <div 
                    className="fixed z-[100] bg-[#2a2a2d] border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto"
                    style={{
                      width: assigneesRef.current?.offsetWidth || 'auto',
                      top: assigneesRef.current ? assigneesRef.current.getBoundingClientRect().bottom + 4 : 0,
                      left: assigneesRef.current ? assigneesRef.current.getBoundingClientRect().left : 0,
                    }}
                  >
                    {users.map((user) => {
                      const isSelected = editedTask.assignees?.includes(user._id);
                      return (
                        <div
                          key={user._id}
                          className="flex items-center px-3 py-2 hover:bg-[#3a3a3d] cursor-pointer"
                          onClick={() => toggleAssignee(user._id)}
                        >
                          {/* Checkbox personnalisée */}
                          <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                            isSelected 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'border-gray-600 bg-[#2a2a2d]'
                          }`}>
                            {isSelected && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>
                          
                          {/* Avatar et nom */}
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs mr-3">
                            {user.prenoms?.charAt(0)}{user.nom?.charAt(0)}
                          </div>
                          
                          {/* Informations */}
                          <div className="flex-1">
                            <div className="font-medium">
                              {user.prenoms} {user.nom}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Compteur */}
              <div className="mt-2 text-xs text-gray-500">
                {editedTask.assignees?.length || 0} personne(s) sélectionnée(s)
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Description (optionelle)</h3>
            <textarea
              value={editedTask.description || ""}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              className="w-full bg-[#2a2a2d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 h-32 resize-none"
              placeholder="Ajouter une description..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}