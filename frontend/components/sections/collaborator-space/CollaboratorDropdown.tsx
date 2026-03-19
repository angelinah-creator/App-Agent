"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, User, Users } from "lucide-react";
import { type Agent } from "@/lib/users-service";

interface CollaboratorDropdownProps {
  collaborators: Agent[];
  selectedCollaborator: Agent | null;
  onSelectCollaborator: (collaborator: Agent | null) => void;
  isOpen: boolean;
  onToggle: () => void;
  loading: boolean;
}

export default function CollaboratorDropdown({
  collaborators,
  selectedCollaborator,
  onSelectCollaborator,
  isOpen,
  onToggle,
  loading,
}: CollaboratorDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCollaborators, setFilteredCollaborators] =
    useState<Agent[]>(collaborators);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Gérer le clic en dehors du dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCollaborators(collaborators);
    } else {
      const filtered = collaborators.filter(
        (collab) =>
          `${collab.prenoms || ""} ${collab.nom || ""}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          collab.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          collab.poste?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCollaborators(filtered);
    }
  }, [searchTerm, collaborators]);

  const handleSelect = (collaborator: Agent) => {
    onSelectCollaborator(collaborator);
  };

  const handleClearSelection = () => {
    onSelectCollaborator(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de sélection */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2d] hover:bg-[#35353a] border border-gray-700 rounded-lg transition-all duration-200 w-full sm:min-w-[240px]"
      >
        {/* <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 border border-gray-500">
          <User className="w-4 h-4 text-gray-500" />
        </div> */}

        {selectedCollaborator?.profilePhoto?.url ? (
          <img
            src={selectedCollaborator.profilePhoto.url}
            alt={`${selectedCollaborator.prenoms} ${selectedCollaborator.nom}`}
            className="w-8 h-8 rounded-full object-cover border border-gray-500"
          />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 border border-gray-500">
            {selectedCollaborator ? (
              <span className="text-xs font-semibold">
                {selectedCollaborator.prenoms?.charAt(0)}
                {selectedCollaborator.nom?.charAt(0)}
              </span>
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
          </div>
        )}

        <div className="flex-1 text-left">
          {selectedCollaborator ? (
            <div>
              <div className="text-sm font-medium">
                {selectedCollaborator.prenoms} {selectedCollaborator.nom}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {selectedCollaborator.poste || selectedCollaborator.profile}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-gray-300">
                Sélectionner un collaborateur
              </div>
              <div className="text-xs text-gray-500">Cliquez pour choisir</div>
            </div>
          )}
        </div>

        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full sm:w-[340px] bg-[#1a1a1d] border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
          {/* En-tête avec recherche */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={14}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-sm bg-[#2a2a2d] border border-gray-700 rounded focus:outline-none focus:border-purple-500"
                autoFocus
              />
            </div>
          </div>

          {/* Liste des collaborateurs */}
          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <div className="py-6 text-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-400">Chargement...</p>
              </div>
            ) : filteredCollaborators.length === 0 ? (
              <div className="py-6 text-center">
                <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun collaborateur</p>
              </div>
            ) : (
              <>
                {/* Liste des collaborateurs */}
                <div className="py-1">
                  {filteredCollaborators.map((collab) => (
                    <button
                      key={collab._id}
                      onClick={() => handleSelect(collab)}
                      className={`w-full p-1.5 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-2 ${
                        selectedCollaborator?._id === collab._id
                          ? "bg-purple-900/20 border-l-2 border-l-purple-500"
                          : ""
                      } ${collab.archived ? "opacity-60" : ""}`}
                    >
                      {collab.profilePhoto?.url ? (
                        <img
                          src={collab.profilePhoto.url}
                          alt={`${collab.prenoms} ${collab.nom}`}
                          className="w-8 h-8 rounded-full object-cover border border-gray-700"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            collab.archived ? "bg-gray-600" : "bg-purple-600"
                          }`}
                        >
                          <span className="text-xs font-semibold">
                            {collab.prenoms?.charAt(0) || ""}
                            {collab.nom?.charAt(0) || ""}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {collab.prenoms} {collab.nom}
                          {collab.archived && (
                            <span className="ml-1 text-xs text-gray-400">
                              (archivé)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {collab.poste || "Aucun poste"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Statistiques en bas */}
          <div className="p-2 border-t border-gray-800 bg-[#151518]">
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-400">
                {collaborators.length} collab.
              </div>
              <div className="text-gray-400">
                {collaborators.filter((c) => !c.archived).length} actif(s)
              </div>
              <div className="text-gray-400">
                {collaborators.filter((c) => c.archived).length} archivé(s)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
