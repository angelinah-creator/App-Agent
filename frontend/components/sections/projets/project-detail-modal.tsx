"use client";

// frontend/components/modals/project-detail-modal.tsx
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  projectService,
  type Project,
  type ProjectMember,
} from "@/lib/project-service";
import type { Agent } from "@/lib/users-service";
import {
  X,
  FileText,
  Upload,
  Trash2,
  Download,
  Users,
  UserMinus,
  Search,
  Calendar,
  Briefcase,
  File,
  Image,
  FileSpreadsheet,
  Film,
  Archive,
  Plus,
  Crown,
  Shield,
  ExternalLink,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { useConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { ProjectModal } from "./project-modal";

interface ProjectDetailModalProps {
  project: Project;
  allUsers: Agent[];
  userRole: "admin" | "manager" | "collaborateur";
  currentUserId?: string;
  onClose: () => void;
  onUpdate: (updated: Project) => void;
  onDeleted?: () => void;
}

type TabType = "files" | "members" | "info";

export function ProjectDetailModal({
  project,
  allUsers,
  userRole,
  currentUserId,
  onClose,
  onUpdate,
  onDeleted,
}: ProjectDetailModalProps) {
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirmDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("files");
  const [memberTab, setMemberTab] = useState<"managers" | "collaborateurs">("collaborateurs");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // ─── Permissions ──────────────────────────────────────────────────────────────
  // Normalise les IDs pour éviter les bugs de comparaison string vs ObjectId
  const normalizeId = (id: any): string =>
    typeof id === "object" && id !== null ? id.toString() : String(id ?? "");

  const currentId = normalizeId(currentUserId);
  const isCreator = normalizeId(project.createdBy._id) === currentId;
  const isInvitedManager = project.invitedManagers.some(
    (m) => normalizeId(m._id) === currentId
  );
  const isInvitedCollab = project.invitedCollaborateurs.some(
    (c) => normalizeId(c._id) === currentId
  );

  const canWrite =
    userRole === "admin" ||
    (userRole === "manager" && (isCreator || isInvitedManager)) ||
    (userRole === "collaborateur" && isInvitedCollab);

  // Managers (créateur OU invité) ET admins peuvent gérer les membres
  const canManageMembers =
    userRole === "admin" ||
    (userRole === "manager" && (isCreator || isInvitedManager));

  // Créateur, managers invités et admins peuvent modifier
  const canEditProject =
    userRole === "admin" ||
    (userRole === "manager" && (isCreator || isInvitedManager));

  // Seuls le créateur et les admins peuvent supprimer
  const canDeleteProject = userRole === "admin" || isCreator;

  // ─── Mutations Fichiers ───────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: (file: File) => projectService.uploadFile(project._id, file),
    onSuccess: (updated) => {
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (publicId: string) =>
      projectService.deleteFile(project._id, publicId),
    onSuccess: (updated) => {
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // ─── Mutations Membres ────────────────────────────────────────────────────────

  const inviteManagerMutation = useMutation({
    mutationFn: (managerId: string) =>
      projectService.inviteManager(project._id, managerId),
    onSuccess: (updated) => {
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const removeManagerMutation = useMutation({
    mutationFn: (managerId: string) =>
      projectService.removeManager(project._id, managerId),
    onSuccess: (updated) => {
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const inviteCollabMutation = useMutation({
    mutationFn: (collabId: string) =>
      projectService.inviteCollaborateur(project._id, collabId),
    onSuccess: (updated) => {
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const removeCollabMutation = useMutation({
    mutationFn: (collabId: string) =>
      projectService.removeCollaborateur(project._id, collabId),
    onSuccess: (updated) => {
      onUpdate(updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.delete(project._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onDeleted?.();
      onClose();
    },
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDeleteFile = (publicId: string, name: string) => {
    confirm({
      title: "Supprimer ce fichier",
      description: `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => deleteFileMutation.mutate(publicId),
    });
  };

  const handleDeleteProject = () => {
    confirm({
      title: "Supprimer ce projet",
      description: `Êtes-vous sûr de vouloir supprimer "${project.name}" ? Cette action supprimera également tous les fichiers associés.`,
      confirmText: "Supprimer définitivement",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: () => deleteMutation.mutate(),
    });
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Film;
    if (mimeType === "application/pdf") return FileText;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return FileSpreadsheet;
    if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Utilisateurs disponibles à inviter
  const availableManagers = allUsers.filter(
    (u) =>
      u.role === "manager" &&
      normalizeId(u._id) !== normalizeId(project.createdBy._id) &&
      !project.invitedManagers.some(
        (m) => normalizeId(m._id) === normalizeId(u._id)
      ) &&
      `${u.prenoms} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableCollabs = allUsers.filter(
    (u) =>
      u.role === "collaborateur" &&
      !project.invitedCollaborateurs.some(
        (c) => normalizeId(c._id) === normalizeId(u._id)
      ) &&
      `${u.prenoms} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = () => {
    const now = new Date();
    if (project.end_time && new Date(project.end_time) < now)
      return { color: "text-red-400", bg: "bg-red-500/10", label: "Terminé" };
    if (project.start_time && new Date(project.start_time) > now)
      return { color: "text-yellow-400", bg: "bg-yellow-500/10", label: "À venir" };
    return { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "En cours" };
  };

  const status = getStatusInfo();

  // ─── Modal d'édition ─────────────────────────────────────────────────────────

  if (showEditModal) {
    return (
      <ProjectModal
        project={project}
        allUsers={allUsers}
        userRole={userRole}
        currentUserId={currentUserId}
        onClose={() => setShowEditModal(false)}
        onSuccess={(updated?: Project) => {
          if (updated) onUpdate(updated);
          setShowEditModal(false);
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }}
      />
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {dialog}
      <div className="bg-[#1F2128] border border-[#313442] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#313442]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#6C4EA8]/20 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-[#9B7FD4]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-semibold text-base truncate">
                  {project.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(project.start_time)} → {formatDate(project.end_time)}
                </span>
                <span>•</span>
                <span>
                  Créé par {project.createdBy.prenoms} {project.createdBy.nom}
                </span>
              </div>
            </div>
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            {canEditProject && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6C4EA8]/20 text-[#9B7FD4] hover:bg-[#6C4EA8]/40 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Modifier
              </button>
            )}
            {canDeleteProject && (
              <button
                onClick={handleDeleteProject}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Supprimer
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 px-6 border-b border-[#313442]">
          {([
            { id: "files", label: `Fichiers (${project.files.length})` },
            {
              id: "members",
              label: `Membres (${
                1 + project.invitedManagers.length + project.invitedCollaborateurs.length
              })`,
            },
            { id: "info", label: "Informations" },
          ] as { id: TabType; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-[#6C4EA8] text-[#9B7FD4]"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ Fichiers ════ */}
          {activeTab === "files" && (
            <div className="p-6 space-y-4">
              {canWrite && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? "border-[#6C4EA8] bg-[#6C4EA8]/10"
                      : "border-[#313442] hover:border-[#6C4EA8]/50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">
                    Glissez vos fichiers ici
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    ou cliquez pour parcourir — PDF, images, documents, vidéos (max 50MB)
                  </p>
                  {uploadMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <div className="w-4 h-4 border-2 border-[#6C4EA8] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-400">Upload en cours...</span>
                    </div>
                  )}
                </div>
              )}

              {project.files.length === 0 ? (
                <div className="text-center py-10">
                  <File className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Aucun fichier</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {canWrite
                      ? "Uploadez votre premier fichier ci-dessus"
                      : "Ce projet n'a pas encore de fichiers"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.files.map((file, idx) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    const isImage = file.mimeType.startsWith("image/");
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-[#282B36] rounded-xl hover:bg-[#2D3040] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1F2128] flex items-center justify-center flex-shrink-0">
                          {isImage ? (
                            <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
                          ) : (
                            <FileIcon className="w-5 h-5 text-[#9B7FD4]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">
                            {file.originalName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>
                              {file.uploadedBy?.prenoms} {file.uploadedBy?.nom}
                            </span>
                            <span>•</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Ouvrir"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={file.url}
                            download={file.originalName}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {canWrite && (
                            <button
                              onClick={() =>
                                handleDeleteFile(file.publicId, file.originalName)
                              }
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ Membres ════ */}
          {activeTab === "members" && (
            <div className="p-6 space-y-5">
              {/* Créateur */}
              <div>
                <h3 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  Créateur du projet
                </h3>
                <MemberRow member={project.createdBy} badge="Créateur" badgeColor="yellow" />
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setMemberTab("managers"); setSearchTerm(""); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    memberTab === "managers"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Managers ({project.invitedManagers.length})
                </button>
                <button
                  onClick={() => { setMemberTab("collaborateurs"); setSearchTerm(""); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    memberTab === "collaborateurs"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Collaborateurs ({project.invitedCollaborateurs.length})
                </button>
              </div>

              {/* ── Managers ── */}
              {memberTab === "managers" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    {project.invitedManagers.length === 0 ? (
                      <p className="text-gray-600 text-xs py-2">Aucun manager invité</p>
                    ) : (
                      project.invitedManagers.map((manager) => (
                        <MemberRow
                          key={manager._id}
                          member={manager}
                          badge="Manager"
                          badgeColor="blue"
                          onRemove={
                            canManageMembers
                              ? () =>
                                  confirm({
                                    title: "Retirer ce manager",
                                    description: `Retirer ${manager.prenoms} ${manager.nom} du projet ?`,
                                    confirmText: "Retirer",
                                    cancelText: "Annuler",
                                    variant: "destructive",
                                    onConfirm: () =>
                                      removeManagerMutation.mutate(manager._id),
                                  })
                              : undefined
                          }
                        />
                      ))
                    )}
                  </div>
                  {canManageMembers && availableManagers.length > 0 && (
                    <InviteSection
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      users={availableManagers}
                      onInvite={(id) => inviteManagerMutation.mutate(id)}
                      isPending={inviteManagerMutation.isPending}
                      accentColor="blue"
                      placeholder="Rechercher un manager..."
                    />
                  )}
                </div>
              )}

              {/* ── Collaborateurs ── */}
              {memberTab === "collaborateurs" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    {project.invitedCollaborateurs.length === 0 ? (
                      <p className="text-gray-600 text-xs py-2">Aucun collaborateur assigné</p>
                    ) : (
                      project.invitedCollaborateurs.map((collab) => (
                        <MemberRow
                          key={collab._id}
                          member={collab}
                          badge="Collaborateur"
                          badgeColor="emerald"
                          onRemove={
                            canManageMembers
                              ? () =>
                                  confirm({
                                    title: "Retirer ce collaborateur",
                                    description: `Retirer ${collab.prenoms} ${collab.nom} du projet ?`,
                                    confirmText: "Retirer",
                                    cancelText: "Annuler",
                                    variant: "destructive",
                                    onConfirm: () =>
                                      removeCollabMutation.mutate(collab._id),
                                  })
                              : undefined
                          }
                        />
                      ))
                    )}
                  </div>
                  {canManageMembers ? (
                    availableCollabs.length > 0 ? (
                      <InviteSection
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        users={availableCollabs}
                        onInvite={(id) => inviteCollabMutation.mutate(id)}
                        isPending={inviteCollabMutation.isPending}
                        accentColor="emerald"
                        placeholder="Rechercher un collaborateur..."
                      />
                    ) : (
                      <p className="text-gray-600 text-xs text-center py-2">
                        Tous les collaborateurs sont déjà invités
                      </p>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-[#282B36] rounded-lg px-3 py-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      Seuls les managers peuvent inviter des collaborateurs
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════ Informations ════ */}
          {activeTab === "info" && (
            <div className="p-6 space-y-5">
              {/* Infos générales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InfoRow label="Nom du projet" value={project.name} />
                </div>
                <InfoRow label="Date de début" value={formatDate(project.start_time)} />
                <InfoRow label="Date de fin" value={formatDate(project.end_time)} />
                <InfoRow
                  label="Créé par"
                  value={`${project.createdBy.prenoms} ${project.createdBy.nom}`}
                />
                <InfoRow label="Créé le" value={formatDate(project.createdAt)} />
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Description</p>
                {project.description ? (
                  <div className="bg-[#282B36] rounded-xl p-4">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {project.description}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#282B36] rounded-xl p-4 text-center">
                    <p className="text-gray-600 text-xs">Aucune description</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Fichiers" value={project.files.length} />
                <StatCard label="Managers invités" value={project.invitedManagers.length} />
                <StatCard label="Collaborateurs" value={project.invitedCollaborateurs.length} />
              </div>

              {/* Séparateur */}
              <div className="h-px bg-[#313442]" />

              {/* Liste des fichiers */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3">
                  Fichiers ({project.files.length})
                </p>
                {project.files.length === 0 ? (
                  <div className="text-center py-6 bg-[#282B36] rounded-xl">
                    <File className="w-8 h-8 text-gray-700 mx-auto mb-1.5" />
                    <p className="text-gray-600 text-xs">Aucun fichier dans ce projet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.files.map((file, idx) => {
                      const FileIcon = getFileIcon(file.mimeType);
                      const isImage = file.mimeType.startsWith("image/");
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 bg-[#282B36] rounded-lg hover:bg-[#2D3040] transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#1F2128] flex items-center justify-center flex-shrink-0">
                            {isImage ? (
                              <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
                            ) : (
                              <FileIcon className="w-4 h-4 text-[#9B7FD4]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs truncate">{file.originalName}</p>
                            <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function MemberRow({
  member,
  badge,
  badgeColor,
  onRemove,
}: {
  member: ProjectMember;
  badge: string;
  badgeColor: "yellow" | "blue" | "emerald";
  onRemove?: () => void;
}) {
  const initials = `${member.prenoms?.[0] || ""}${member.nom?.[0] || ""}`.toUpperCase();
  const colors = {
    yellow: "bg-yellow-500/10 text-yellow-400",
    blue: "bg-blue-500/10 text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#282B36] transition-colors group">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#6C4EA8]/20 flex items-center justify-center flex-shrink-0">
        {member.profilePhoto?.url ? (
          <img src={member.profilePhoto.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-[#9B7FD4]">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium">
          {member.prenoms} {member.nom}
        </p>
        <p className="text-gray-500 text-xs truncate">{member.email}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${colors[badgeColor]}`}>
        {badge}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function InviteSection({
  searchTerm,
  onSearchChange,
  users,
  onInvite,
  isPending,
  accentColor,
  placeholder,
}: {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  users: Agent[];
  onInvite: (id: string) => void;
  isPending: boolean;
  accentColor: "blue" | "emerald";
  placeholder: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-[#313442]" />
        <span className="text-xs text-gray-600">Inviter</span>
        <div className="h-px flex-1 bg-[#313442]" />
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#282B36] border border-[#313442] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8]"
        />
      </div>
      <div className="space-y-1 max-h-44 overflow-y-auto">
        {users.map((user) => (
          <InviteRow
            key={user._id}
            user={user}
            onInvite={() => onInvite(user._id)}
            isPending={isPending}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

function InviteRow({
  user,
  onInvite,
  isPending,
  accentColor,
}: {
  user: Agent;
  onInvite: () => void;
  isPending: boolean;
  accentColor: "blue" | "emerald";
}) {
  const initials = `${user.prenoms?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#282B36] transition-colors">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#313442] flex items-center justify-center flex-shrink-0">
        {user.profilePhoto?.url ? (
          <img src={user.profilePhoto.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-gray-400">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-300 text-xs font-medium">
          {user.prenoms} {user.nom}
        </p>
        <p className="text-gray-600 text-xs truncate">{user.email}</p>
      </div>
      {user.profile && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            accentColor === "blue"
              ? "bg-blue-500/10 text-blue-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {user.profile}
        </span>
      )}
      <button
        onClick={onInvite}
        disabled={isPending}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-50 ${
          accentColor === "blue"
            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
        }`}
      >
        <Plus className="w-3 h-3" />
        Inviter
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#282B36] rounded-xl p-3 text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}