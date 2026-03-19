"use client";

import { useState, useEffect, useCallback } from "react";
import { UserX } from "lucide-react";
import { usersService, type Agent } from "@/lib/users-service";
import { taskAdminService } from "@/lib/task-admin-service";
import { Task } from "@/lib/task-service";
import CollaboratorDropdown from "./CollaboratorDropdown";
import CollaboratorKanban from "./CollaboratorKanban";

export default function CollaboratorSpace() {
  const [collaborators, setCollaborators] = useState<Agent[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Agent | null>(null);
  const [collaboratorTasks, setCollaboratorTasks] = useState<Task[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const loadCollaborators = useCallback(async () => {
    try {
      setLoadingCollaborators(true);
      const data = await usersService.searchUsers({
        role: "collaborateur",
      });
      setCollaborators(data);
    } catch (error) {
      console.error("Erreur chargement collaborateurs:", error);
    } finally {
      setLoadingCollaborators(false);
    }
  }, []);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

  useEffect(() => {
    if (selectedCollaborator) {
      loadCollaboratorTasks(selectedCollaborator._id);
    } else {
      setCollaboratorTasks([]);
    }
  }, [selectedCollaborator]);

  const loadCollaboratorTasks = async (userId: string) => {
    try {
      setLoadingTasks(true);
      const tasks = await taskAdminService.getUserTasks(userId);
      setCollaboratorTasks(tasks);
    } catch (error) {
      console.error("Erreur chargement tâches:", error);
      setCollaboratorTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleLoadSubtasks = async (taskId: string): Promise<Task[]> => {
    try {
      return await taskAdminService.getSubtasks(taskId);
    } catch (error) {
      console.error("Erreur chargement sous-tâches:", error);
      return [];
    }
  };

  const handleSelectCollaborator = (collaborator: Agent | null) => {
    setSelectedCollaborator(collaborator);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="bg-[#0f0f10] text-gray-100">

      <div className="mb-4 sm:mb-6 px-2 sm:px-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Espace Collaborateur</h1>
        <p className="text-gray-400 mt-1 text-sm">Visionnez les tâches de vos collaborateurs</p>
      </div>
      {/* Barre de navigation */}
      <div className="px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <CollaboratorDropdown
              collaborators={collaborators}
              selectedCollaborator={selectedCollaborator}
              onSelectCollaborator={handleSelectCollaborator}
              isOpen={isDropdownOpen}
              onToggle={toggleDropdown}
              loading={loadingCollaborators}
            />
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-2 sm:p-4">
        {selectedCollaborator ? (
          <CollaboratorKanban
            collaborator={selectedCollaborator}
            tasks={collaboratorTasks}
            loading={loadingTasks}
            onLoadSubtasks={handleLoadSubtasks}
          />
        ) : (
          <div className="h-[calc(100vh-250px)] flex flex-col items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 sm:w-25 h-20 sm:h-25 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserX className="text-gray-500 w-10 sm:w-12 h-10 sm:h-12"/>
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">Aucun collaborateur sélectionné</h2>
              <p className="text-sm text-gray-400 mb-4">
                Sélectionnez un collaborateur dans le menu déroulant pour consulter ses tâches.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}