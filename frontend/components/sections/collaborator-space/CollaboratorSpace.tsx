"use client";

import { useState, useEffect, useCallback } from "react";
import { usersService, type Agent } from "@/lib/users-service";
import { taskAdminService } from "@/lib/task-admin-service";
import { Task } from "@/lib/task-service";
import CollaboratorList from "./CollaboratorList";
import CollaboratorKanban from "./CollaboratorKanban";

export default function CollaboratorSpace() {
  const [collaborators, setCollaborators] = useState<Agent[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Agent | null>(null);
  const [collaboratorTasks, setCollaboratorTasks] = useState<Task[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Mémoisation des fonctions pour éviter les re-renders inutiles
  const loadCollaborators = useCallback(async (search = "") => {
    try {
      setLoadingCollaborators(true);
      // Charger tous les collaborateurs (non archivés par défaut)
      const data = await usersService.searchUsers({
        role: "collaborateur",
        searchTerm: search || undefined,
      });
      setCollaborators(data);
      if (data.length > 0 && !selectedCollaborator) {
        setSelectedCollaborator(data[0]);
      }
    } catch (error) {
      console.error("Erreur chargement collaborateurs:", error);
    } finally {
      setLoadingCollaborators(false);
    }
  }, [selectedCollaborator]);

  // Charger les collaborateurs au démarrage
  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

  // Charger les tâches quand un collaborateur est sélectionné
  useEffect(() => {
    if (selectedCollaborator) {
      loadCollaboratorTasks(selectedCollaborator._id);
    }
  }, [selectedCollaborator]);

  const loadCollaboratorTasks = async (userId: string) => {
    try {
      setLoadingTasks(true);
      // Utiliser le nouveau service admin pour récupérer les tâches
      const tasks = await taskAdminService.getUserTasks(userId);
      setCollaboratorTasks(tasks);
    } catch (error) {
      console.error("Erreur chargement tâches collaborateur:", error);
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

  const handleSelectCollaborator = (collaborator: Agent) => {
    setSelectedCollaborator(collaborator);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Utiliser un délai pour éviter trop d'appels API
    const timeoutId = setTimeout(() => {
      loadCollaborators(term);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-gray-100 flex">
      {/* Sidebar des collaborateurs */}
      <div className="w-80 bg-[#1a1a1d] border-r border-gray-800 flex flex-col">
        <CollaboratorList
          collaborators={collaborators}
          selectedCollaborator={selectedCollaborator}
          onSelectCollaborator={handleSelectCollaborator}
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          loading={loadingCollaborators}
        />
      </div>

      {/* Espace Kanban du collaborateur */}
      <div className="flex-1">
        {selectedCollaborator ? (
          <CollaboratorKanban
            collaborator={selectedCollaborator}
            tasks={collaboratorTasks}
            loading={loadingTasks}
            onLoadSubtasks={handleLoadSubtasks}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sélectionnez un collaborateur</h3>
              <p className="text-gray-400">
                Choisissez un collaborateur dans la sidebar pour voir ses tâches en mode consultation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}