"use client";

import { useState, useEffect } from "react";
import { Search, User, Users, Briefcase, Calendar, Clock, ChevronRight } from "lucide-react";
import { usersService, type Agent } from "@/lib/users-service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CollaboratorListProps {
  collaborators: Agent[];
  selectedCollaborator: Agent | null;
  onSelectCollaborator: (collaborator: Agent) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loading: boolean;
}

export default function CollaboratorList({
  collaborators,
  selectedCollaborator,
  onSelectCollaborator,
  searchTerm = "", // ✅ Valeur par défaut
  onSearchChange,
  loading,
}: CollaboratorListProps) {
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    archivés: 0,
  });

  useEffect(() => {
    if (collaborators.length > 0) {
      setStats({
        total: collaborators.length,
        actifs: collaborators.filter(c => !c.archived).length,
        archivés: collaborators.filter(c => c.archived).length,
      });
    }
  }, [collaborators]);

  // ✅ Gérer le changement de recherche avec délai
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || "";
    onSearchChange(value);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Rechercher un collaborateur..."
              value="" // ✅ Valeur vide contrôlée
              className="w-full pl-10 pr-4 py-2 bg-[#2a2a2d] border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
              disabled
              readOnly
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* En-tête avec recherche */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Rechercher un collaborateur..."
            value={searchTerm || ""} // ✅ S'assurer que ce n'est jamais undefined
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-[#2a2a2d] border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Liste des collaborateurs */}
      <div className="flex-1 overflow-y-auto p-2">
        {collaborators.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucun collaborateur trouvé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map((collab) => (
              <button
                key={collab._id}
                onClick={() => onSelectCollaborator(collab)}
                className={`w-full text-left p-3 rounded-lg transition flex items-center justify-between ${
                  selectedCollaborator?._id === collab._id
                    ? "bg-[#6C4EA8] text-white"
                    : "hover:bg-gray-800"
                } ${collab.archived ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    collab.archived ? "bg-gray-600" : "bg-purple-600"
                  }`}>
                    <span className="font-semibold">
                      {collab.prenoms?.charAt(0) || ''}{collab.nom?.charAt(0) || ''}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">
                      {collab.prenoms || ''} {collab.nom || ''}
                      {collab.archived && (
                        <span className="ml-2 text-xs text-gray-400">(archivé)</span>
                      )}
                    </div>
                    {/* <div className="text-xs text-gray-400 truncate">
                      {collab.poste || "Aucun poste"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {collab.profile || ''}
                    </div> */}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}