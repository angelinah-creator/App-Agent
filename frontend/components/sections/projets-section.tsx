"use client";

// frontend/components/sections/projets-section.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  projectService,
  type Project,
} from "@/lib/project-service";
import { usersService, type Agent } from "@/lib/users-service";
import { authService } from "@/lib/auth-service";
import {
  Plus,
  FolderOpen,
  Search,
  Filter,
  Calendar,
  Users,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  Upload,
  UserPlus,
  ChevronRight,
  Briefcase,
  Clock,
  Tag,
} from "lucide-react";
import { ProjectModal } from "./projets/project-modal";
import { ProjectDetailModal } from "./projets/project-detail-modal";
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Button } from "../ui/button";

interface ProjetsSectionProps {
  userRole: "admin" | "manager" | "collaborateur";
}

export function ProjetsSection({ userRole }: ProjetsSectionProps) {
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirmDialog();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────────

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: authService.getProfile,
  });

  const {
    data: projects = [],
    isLoading,
  } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  // Utilise la route /projects/available-members accessible aux managers ET admins
  // (contrairement à GET /users qui est admin only)
  const { data: availableMembers } = useQuery({
    queryKey: ["available-members"],
    queryFn: () => projectService.getAvailableMembers(),
    enabled: userRole === "admin" || userRole === "manager",
  });

  // Fusionne managers + collaborateurs en un seul tableau pour les modals
  const allUsers: Agent[] = [
    ...(availableMembers?.managers || []),
    ...(availableMembers?.collaborateurs || []),
  ];

  // ─── Mutations ────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleDelete = (project: Project) => {
    confirm({
      title: "Supprimer ce projet",
      description: `Êtes-vous sûr de vouloir supprimer "${project.name}" ? Cette action supprimera également tous les fichiers associés.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => deleteMutation.mutate(project._id),
    });
  };

  const handleOpenDetail = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
    setOpenMenuId(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowCreateModal(true);
    setOpenMenuId(null);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingProject(null);
  };

  const handleDetailClose = () => {
    setShowDetailModal(false);
    setSelectedProject(null);
  };

  // ─── Filtres ──────────────────────────────────────────────────────────────────

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const canCreateProject = userRole === "admin" || userRole === "manager";

  const isOwner = (project: Project) =>
    profile && project.createdBy._id === (profile as any)._id;

  const canDeleteProject = (project: Project) =>
    userRole === "admin" || isOwner(project);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getMembersCount = (project: Project) =>
    project.invitedManagers.length + project.invitedCollaborateurs.length;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 -mt-8">
      {dialog}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            {userRole === "collaborateur" ? "Mes Projets" : "Gestion des Projets"}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {userRole === "collaborateur"
              ? "Projets auxquels vous participez"
              : "Créez et gérez vos projets"}
          </p>
        </div>
        {canCreateProject && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#6C4EA8] hover:bg-[#382d4e] text-white hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Nouveau projet
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher un projet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#1F2128] border border-[#313442] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6C4EA8] transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1F2128] border border-[#313442] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#6C4EA8]/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-[#9B7FD4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{filteredProjects.length}</p>
              <p className="text-xs text-gray-400">Total projets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#6C4EA8] border-t-transparent" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#1F2128] rounded-2xl flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Aucun projet trouvé</p>
          <p className="text-gray-600 text-sm mt-1">
            {canCreateProject
              ? "Créez votre premier projet en cliquant sur le bouton ci-dessus"
              : "Vous n'avez pas encore été invité à des projets"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            return (
              <div
                key={project._id}
                className="bg-[#1F2128] border border-[#313442] rounded-xl p-5 hover:border-[#6C4EA8]/50 transition-all group relative"
              >
                {/* Header card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-xl truncate">
                      {project.name}
                    </h3>
                  </div>

                  {/* Menu contextuel */}
                  <div className="relative ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === project._id ? null : project._id
                        );
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === project._id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-8 z-20 bg-[#282B36] border border-[#313442] rounded-xl shadow-2xl w-44 overflow-hidden">
                          <button
                            onClick={() => handleOpenDetail(project)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Voir le détail
                          </button>
                          {(userRole === "admin" || userRole === "manager") && (
                            <button
                              onClick={() => handleEdit(project)}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Modifier
                            </button>
                          )}
                          {canDeleteProject(project) && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(project);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}

                {/* Dates */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.start_time)}
                  </div>
                  {project.end_time && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      <span>{formatDate(project.end_time)}</span>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#313442]">
                  {/* Membres avatars */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2">
                      {/* Créateur */}
                      <MemberAvatar member={project.createdBy} />
                      {/* Managers invités */}
                      {project.invitedManagers.slice(0, 2).map((m) => (
                        <MemberAvatar key={m._id} member={m} />
                      ))}
                      {/* Collaborateurs */}
                      {project.invitedCollaborateurs.slice(0, 2).map((c) => (
                        <MemberAvatar key={c._id} member={c} />
                      ))}
                      {getMembersCount(project) > 4 && (
                        <div className="w-7 h-7 rounded-full bg-[#313442] border-2 border-[#1F2128] flex items-center justify-center">
                          <span className="text-xs text-gray-400">
                            +{getMembersCount(project) - 4}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {getMembersCount(project) + 1} membre
                      {getMembersCount(project) + 1 > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Click overlay */}
                <button
                  className="absolute inset-0 rounded-xl"
                  onClick={() => handleOpenDetail(project)}
                  aria-label={`Ouvrir ${project.name}`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ProjectModal
          project={editingProject}
          allUsers={allUsers}
          userRole={userRole}
          currentUserId={(profile as any)?._id}
          onClose={handleModalClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            handleModalClose();
          }}
        />
      )}

      {showDetailModal && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          allUsers={allUsers}
          userRole={userRole}
          currentUserId={(profile as any)?._id}
          onClose={handleDetailClose}
          onUpdate={(updated) => setSelectedProject(updated)}
        />
      )}
    </div>
  );
}

// ─── Composant Avatar membre ───────────────────────────────────────────────────

function MemberAvatar({ member }: { member: { nom: string; prenoms: string; profilePhoto?: { url: string } } }) {
  const initials = `${member.prenoms?.[0] || ""}${member.nom?.[0] || ""}`.toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full border-2 border-[#1F2128] overflow-hidden bg-[#6C4EA8]/30 flex items-center justify-center flex-shrink-0">
      {member.profilePhoto?.url ? (
        <img
          src={member.profilePhoto.url}
          alt={`${member.prenoms} ${member.nom}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xs font-medium text-[#9B7FD4]">{initials}</span>
      )}
    </div>
  );
}