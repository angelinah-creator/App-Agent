"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  projectService,
  type Project,
  type CreateProjectDto,
} from "@/lib/project-service";
import type { Agent } from "@/lib/users-service";
import {
  X,
  Briefcase,
  Calendar,
  Users,
  Search,
  Check,
  UserCheck,
} from "lucide-react";

interface ProjectModalProps {
  project?: Project | null; // null = création, Project = édition
  allUsers: Agent[];
  userRole: "admin" | "manager" | "collaborateur";
  currentUserId?: string;
  onClose: () => void;
  onSuccess: (updated?: Project) => void;
}

export function ProjectModal({
  project,
  allUsers,
  userRole,
  currentUserId,
  onClose,
  onSuccess,
}: ProjectModalProps) {
  const isEditing = !!project;

  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    start_time: project?.start_time
      ? project.start_time.split("T")[0]
      : "",
    end_time: project?.end_time ? project.end_time.split("T")[0] : "",
  });

  const [selectedManagers, setSelectedManagers] = useState<string[]>(
    project?.invitedManagers.map((m) => m._id) || []
  );
  const [selectedCollabs, setSelectedCollabs] = useState<string[]>(
    project?.invitedCollaborateurs.map((c) => c._id) || []
  );

  const [managerSearch, setManagerSearch] = useState("");
  const [collabSearch, setCollabSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "membres">("info");

  // Filtrer les utilisateurs par rôle
  const managers = allUsers.filter(
    (u) => u.role === "manager" && u._id !== currentUserId
  );
  const collaborateurs = allUsers.filter(
    (u) => u.role === "collaborateur"
  );

  const filteredManagers = managers.filter(
    (m) =>
      `${m.prenoms} ${m.nom}`.toLowerCase().includes(managerSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(managerSearch.toLowerCase())
  );
  const filteredCollabs = collaborateurs.filter(
    (c) =>
      `${c.prenoms} ${c.nom}`.toLowerCase().includes(collabSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(collabSearch.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => projectService.create(data),
    onSuccess: (data) => onSuccess(data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateProjectDto) =>
      projectService.update(project!._id, data),
    onSuccess: (data) => onSuccess(data),
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const payload: CreateProjectDto = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      start_time: formData.start_time || undefined,
      end_time: formData.end_time || undefined,
      invitedManagers: selectedManagers,
      invitedCollaborateurs: selectedCollabs,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleManager = (id: string) => {
    setSelectedManagers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCollab = (id: string) => {
    setSelectedCollabs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F2128] border border-[#313442] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#313442]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6C4EA8]/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-[#9B7FD4]" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">
                {isEditing ? "Modifier le projet" : "Nouveau projet"}
              </h2>
              <p className="text-gray-500 text-xs">
                {isEditing ? "Mettez à jour les informations" : "Créez un nouveau projet"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(["info", "membres"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#6C4EA8] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "info" ? "Informations" : `Membres (${selectedManagers.length + selectedCollabs.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {activeTab === "info" && (
            <>
              {/* Nom */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Nom du projet <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Refonte site web client X"
                  className="w-full px-3 py-2.5 bg-[#282B36] border border-[#313442] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Décrivez les objectifs et le contexte du projet..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#282B36] border border-[#313442] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    Date de début
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="date"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, start_time: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-[#282B36] border border-[#313442] rounded-lg text-sm text-white focus:outline-none focus:border-[#6C4EA8] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    Date de fin
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="date"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, end_time: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-[#282B36] border border-[#313442] rounded-lg text-sm text-white focus:outline-none focus:border-[#6C4EA8] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "membres" && (
            <div className="space-y-5">
              {/* Section Managers */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <h3 className="text-white text-sm font-medium">
                    Managers invités
                  </h3>
                  <span className="ml-auto text-xs text-gray-500 bg-[#282B36] px-2 py-0.5 rounded-full">
                    {selectedManagers.length} sélectionné{selectedManagers.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Rechercher un manager..."
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#282B36] border border-[#313442] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors"
                  />
                </div>

                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {filteredManagers.length === 0 ? (
                    <p className="text-center text-gray-600 text-xs py-4">
                      Aucun manager trouvé
                    </p>
                  ) : (
                    filteredManagers.map((manager) => (
                      <UserSelectRow
                        key={manager._id}
                        user={manager}
                        selected={selectedManagers.includes(manager._id)}
                        onToggle={() => toggleManager(manager._id)}
                        accentColor="blue"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Séparateur */}
              <div className="h-px bg-[#313442]" />

              {/* Section Collaborateurs */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h3 className="text-white text-sm font-medium">
                    Collaborateurs assignés
                  </h3>
                  <span className="ml-auto text-xs text-gray-500 bg-[#282B36] px-2 py-0.5 rounded-full">
                    {selectedCollabs.length} sélectionné{selectedCollabs.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Rechercher un collaborateur..."
                    value={collabSearch}
                    onChange={(e) => setCollabSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#282B36] border border-[#313442] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors"
                  />
                </div>

                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {filteredCollabs.length === 0 ? (
                    <p className="text-center text-gray-600 text-xs py-4">
                      Aucun collaborateur trouvé
                    </p>
                  ) : (
                    filteredCollabs.map((collab) => (
                      <UserSelectRow
                        key={collab._id}
                        user={collab}
                        selected={selectedCollabs.includes(collab._id)}
                        onToggle={() => toggleCollab(collab._id)}
                        accentColor="emerald"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#313442]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isPending}
            className="px-5 py-2 bg-[#6C4EA8] hover:bg-[#7D5FBF] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isPending && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isEditing ? "Enregistrer" : "Créer le projet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant ligne de sélection d'utilisateur ───────────────────────────────

interface UserSelectRowProps {
  user: Agent;
  selected: boolean;
  onToggle: () => void;
  accentColor: "blue" | "emerald";
}

function UserSelectRow({ user, selected, onToggle, accentColor }: UserSelectRowProps) {
  const initials = `${user.prenoms?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  const colors = {
    blue: {
      check: "bg-blue-500 border-blue-500",
      badge: "bg-blue-500/10 text-blue-400",
    },
    emerald: {
      check: "bg-emerald-500 border-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-400",
    },
  };

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        selected
          ? "bg-[#313442]"
          : "hover:bg-[#282B36]"
      }`}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#6C4EA8]/20 flex items-center justify-center flex-shrink-0">
        {user.profilePhoto?.url ? (
          <img
            src={user.profilePhoto.url}
            alt={`${user.prenoms} ${user.nom}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-[#9B7FD4]">{initials}</span>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-white text-xs font-medium truncate">
          {user.prenoms} {user.nom}
        </p>
        <p className="text-gray-500 text-xs truncate">{user.email}</p>
      </div>

      {/* Badge profil */}
      {user.profile && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${colors[accentColor].badge} flex-shrink-0`}>
          {user.profile}
        </span>
      )}

      {/* Checkbox */}
      <div
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          selected
            ? colors[accentColor].check
            : "border-[#4A4E5A] bg-transparent"
        }`}
      >
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}