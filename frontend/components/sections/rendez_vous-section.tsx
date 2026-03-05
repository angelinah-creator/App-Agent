"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rendezVousService,
  type RendezVousLink,
  type CreateRendezVousDto,
} from "@/lib/rendez-vous-service";
import {
  Calendar,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  Check,
  Link as LinkIcon,
  User,
  Users,
} from "lucide-react";

interface RendezVousSectionProps {
  userRole: "admin" | "manager" | "collaborateur" | "client";
  userName?: string;
}

// ─── Modal Formulaire ───────────────────────────────────────────────────────

function CalendlyFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  initialData,
  mode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRendezVousDto) => void;
  isLoading: boolean;
  initialData?: Partial<RendezVousLink>;
  mode: "create" | "edit";
}) {
  const [lienCalendly, setLienCalendly] = useState(
    initialData?.lienCalendly || "",
  );
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!lienCalendly.trim()) {
      setError("Le lien Calendly est obligatoire.");
      return;
    }
    if (
      !lienCalendly.startsWith("https://calendly.com/") &&
      !lienCalendly.startsWith("https://")
    ) {
      setError("Veuillez entrer un lien valide (commençant par https://).");
      return;
    }
    onSubmit({ lienCalendly, description });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F2128] border border-[#313442] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#313442]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#6C4EA8]/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#6C4EA8]" />
            </div>
            <h2 className="text-white font-semibold text-base">
              {mode === "create"
                ? "Ajouter mon lien Calendly"
                : "Modifier mon lien Calendly"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Lien Calendly *
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="url"
                value={lienCalendly}
                onChange={(e) => setLienCalendly(e.target.value)}
                placeholder="https://calendly.com/votre-nom/..."
                className="w-full bg-[#0F0F12] border border-[#313442] text-white text-sm rounded-lg pl-10 pr-4 py-3 placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Description{" "}
              <span className="text-gray-600 normal-case">(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le type de réunion proposé..."
              rows={3}
              className="w-full bg-[#0F0F12] border border-[#313442] text-white text-sm rounded-lg px-4 py-3 placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#313442] text-gray-300 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-[#6C4EA8] text-white rounded-lg hover:bg-[#5a3d96] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {mode === "create" ? "Ajouter" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card Lien Calendly ─────────────────────────────────────────────────────
function CalendlyCard({
  link,
  isOwner,
  canEdit,
  onEdit,
  onDelete,
  deleteLoading,
}: {
  link: RendezVousLink;
  isOwner: boolean;
  canEdit: boolean;
  onEdit: (link: RendezVousLink) => void;
  onDelete: (id: string) => void;
  deleteLoading: boolean;
}) {
  const roleLabel = link.role === "admin" ? "Admin" : "Manager";
  const roleColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";

  const initiales =
    `${link.prenoms?.[0] || ""}${link.nom?.[0] || ""}`.toUpperCase();

  return (
    <div className="group bg-[#1F2128] border border-[#313442] rounded-xl p-5 hover:border-[#6C4EA8]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[#6C4EA8]/5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Photo ou initiales */}
          {link.profilePhoto?.url ? (
            <img
              src={link.profilePhoto.url}
              alt={`${link.prenoms} ${link.nom}`}
              className="w-11 h-11 rounded-full object-cover border-2 border-[#313442] flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#6C4EA8] border border-[#6C4EA8]/30 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
              {initiales}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {link.prenoms} {link.nom}
            </p>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${roleColor}`}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onEdit(link)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(link._id)}
              disabled={deleteLoading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {link.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">
          {link.description}
        </p>
      )}

      {/* Lien affiché */}
      <div className="flex items-center gap-2 bg-[#0F0F12] border border-[#313442] rounded-lg px-3 py-2 mb-4">
        <LinkIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-gray-400 text-xs truncate">
          {link.lienCalendly}
        </span>
      </div>

      {/* Bouton */}
      {isOwner ? (
        <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#313442] text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
          <Calendar className="w-4 h-4" />
          C'est votre lien
        </div>
      ) : (
        <a
          href={link.lienCalendly}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C4EA8] hover:bg-[#5a3d96] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Prendre rendez-vous
        </a>
      )}
    </div>
  );
}

// ─── Section principale ─────────────────────────────────────────────────────

export function RendezVousSection({ userRole }: RendezVousSectionProps) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<RendezVousLink | null>(null);

  const canManage = userRole === "admin" || userRole === "manager";

  // Récupérer tous les liens
  const { data: links = [], isLoading } = useQuery<RendezVousLink[]>({
    queryKey: ["rendez-vous"],
    queryFn: rendezVousService.getAllLinks,
  });

  // Récupérer son propre lien
  const { data: myLink } = useQuery<RendezVousLink | null>({
    queryKey: ["rendez-vous-me"],
    queryFn: rendezVousService.getMyLink,
    enabled: canManage,
  });

  // Mutation créer
  const createMutation = useMutation({
    mutationFn: rendezVousService.createLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rendez-vous"] });
      queryClient.invalidateQueries({ queryKey: ["rendez-vous-me"] });
      setShowModal(false);
    },
    onError: (error: any) => {
      alert(
        error.response?.data?.message || "Erreur lors de la création du lien",
      );
    },
  });

  // Mutation modifier
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      rendezVousService.updateLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rendez-vous"] });
      queryClient.invalidateQueries({ queryKey: ["rendez-vous-me"] });
      setEditingLink(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erreur lors de la modification");
    },
  });

  // Mutation supprimer
  const deleteMutation = useMutation({
    mutationFn: rendezVousService.deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rendez-vous"] });
      queryClient.invalidateQueries({ queryKey: ["rendez-vous-me"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erreur lors de la suppression");
    },
  });

  const handleCreate = (data: CreateRendezVousDto) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: CreateRendezVousDto) => {
    if (!editingLink) return;
    updateMutation.mutate({ id: editingLink._id, data });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) return;
    deleteMutation.mutate(id);
  };

  // Séparer admins et managers
  const adminLinks = links.filter((l) => l.role === "admin");
  const managerLinks = links.filter((l) => l.role === "manager");

  return (
    <div className="space-y-6 -mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-extrabold">Rendez-vous</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {canManage
              ? "Gérez votre lien Calendly et consultez les disponibilités"
              : "Prenez rendez-vous"}
          </p>
        </div>

        {/* Bouton ajouter — uniquement si admin/manager sans lien existant */}
        {canManage && !myLink && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#6C4EA8] text-white text-sm font-medium rounded-xl hover:bg-[#5a3d96] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter mon lien
          </button>
        )}
      </div>

      {/* Chargement */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#313442] border-t-[#6C4EA8] rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm mt-3">Chargement...</p>
          </div>
        </div>
      )}

      {/* Aucun lien */}
      {!isLoading && links.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-[#1F2128] border border-[#313442] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white font-medium mb-1">Aucun lien disponible</p>
          <p className="text-gray-500 text-sm">
            {canManage
              ? "Ajoutez votre lien Calendly pour permettre aux collaborateurs de prendre rendez-vous."
              : "Aucun lien de prise de rendez-vous n'est disponible pour le moment."}
          </p>
        </div>
      )}

      {/* Section Administrateurs */}
      {!isLoading && adminLinks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-gray-300 text-sm font-semibold uppercase tracking-wide">
              Administrateurs
            </h2>
            <span className="text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20 px-2 py-0.5 rounded-full">
              {adminLinks.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminLinks.map((link) => (
              <CalendlyCard
                key={link._id}
                link={link}
                isOwner={myLink?._id === link._id}
                canEdit={
                  canManage &&
                  (myLink?._id === link._id || userRole === "admin")
                }
                onEdit={setEditingLink}
                onDelete={handleDelete}
                deleteLoading={deleteMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section Managers */}
      {!isLoading && managerLinks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-gray-300 text-sm font-semibold uppercase tracking-wide">
              Managers
            </h2>
            <span className="text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20 px-2 py-0.5 rounded-full">
              {managerLinks.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {managerLinks.map((link) => (
              <CalendlyCard
                key={link._id}
                link={link}
                isOwner={myLink?._id === link._id}
                canEdit={
                  canManage &&
                  (myLink?._id === link._id || userRole === "admin")
                }
                onEdit={setEditingLink}
                onDelete={handleDelete}
                deleteLoading={deleteMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Créer */}
      <CalendlyFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        mode="create"
      />

      {/* Modal Modifier */}
      {editingLink && (
        <CalendlyFormModal
          isOpen={true}
          onClose={() => setEditingLink(null)}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          initialData={editingLink}
          mode="edit"
        />
      )}
    </div>
  );
}
