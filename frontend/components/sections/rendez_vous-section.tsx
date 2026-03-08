"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rendezVousService,
  type RendezVousLink,
  type CreateRendezVousDto,
  type SocialLinks,
} from "@/lib/rendez-vous-service";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Link as LinkIcon,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Globe,
  MessageCircle,
} from "lucide-react";

interface RendezVousSectionProps {
  userRole: "admin" | "manager" | "collaborateur" | "client";
  userName?: string;
}

// ─── Icône X / Twitter ─────────────────────────────────────────────────────
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ─── Icône TikTok ──────────────────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
    </svg>
  );
}

// ─── Icône WhatsApp ────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─── Config réseaux sociaux ────────────────────────────────────────────────
const SOCIAL_CONFIG = [
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500", placeholder: "https://facebook.com/votre-profil" },
  { key: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500", placeholder: "https://instagram.com/votre-profil" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-400", placeholder: "https://linkedin.com/in/votre-profil" },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon, color: "text-gray-200", placeholder: "https://tiktok.com/@votre-profil" },
  { key: "x", label: "X (Twitter)", icon: XIcon, color: "text-gray-200", placeholder: "https://x.com/votre-profil" },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, color: "text-green-400", placeholder: "+261 34 00 000 00" },
  { key: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500", placeholder: "https://youtube.com/@votre-chaine" },
  { key: "github", label: "GitHub", icon: Github, color: "text-gray-300", placeholder: "https://github.com/votre-profil" },
  { key: "website", label: "Site web", icon: Globe, color: "text-teal-400", placeholder: "https://votre-site.com" },
] as const;

// ─── Modal Formulaire ──────────────────────────────────────────────────────
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
  const [lienCalendly, setLienCalendly] = useState(initialData?.lienCalendly || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialData?.socialLinks || {});
  const [showSocials, setShowSocials] = useState(
    !!(initialData?.socialLinks && Object.values(initialData.socialLinks).some(Boolean))
  );
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (!lienCalendly.trim()) {
      setError("Le lien Calendly est obligatoire.");
      return;
    }
    if (!lienCalendly.startsWith("https://")) {
      setError("Veuillez entrer un lien valide (commençant par https://).");
      return;
    }
    // Nettoyer les réseaux sociaux vides
    const cleanedSocials: SocialLinks = {};
    Object.entries(socialLinks).forEach(([key, val]) => {
      if (val && val.trim()) cleanedSocials[key as keyof SocialLinks] = val.trim();
    });
    onSubmit({ lienCalendly, description, socialLinks: cleanedSocials });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F2128] border border-[#313442] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#313442] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#6C4EA8]/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#6C4EA8]" />
            </div>
            <h2 className="text-white font-semibold text-base">
              {mode === "create" ? "Ajouter mon lien Calendly" : "Modifier mon lien Calendly"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Lien Calendly */}
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Description <span className="text-gray-600 normal-case">(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le type de réunion proposé..."
              rows={2}
              className="w-full bg-[#0F0F12] border border-[#313442] text-white text-sm rounded-lg px-4 py-3 placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors resize-none"
            />
          </div>

          {/* Toggle réseaux sociaux */}
          <div>
            <button
              onClick={() => setShowSocials(!showSocials)}
              className="flex items-center gap-2 text-sm text-[#A78BFA] hover:text-white transition-colors"
            >
              <span className="w-4 h-4 rounded border border-[#A78BFA] flex items-center justify-center text-xs">
                {showSocials ? "−" : "+"}
              </span>
              {showSocials ? "Masquer les réseaux sociaux" : "Ajouter mes réseaux sociaux (optionnel)"}
            </button>
          </div>

          {/* Réseaux sociaux */}
          {showSocials && (
            <div className="space-y-2.5 pt-1">
              <p className="text-xs text-gray-500">Tous les champs sont optionnels</p>
              {SOCIAL_CONFIG.map(({ key, label, icon: Icon, color, placeholder }) => (
                <div key={key} className="relative">
                  <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${color}`} />
                  <input
                    type="text"
                    value={socialLinks[key as keyof SocialLinks] || ""}
                    onChange={(e) =>
                      setSocialLinks({ ...socialLinks, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    className="w-full bg-[#0F0F12] border border-[#313442] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-600 focus:outline-none focus:border-[#6C4EA8] transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 pt-3 border-t border-[#313442] flex-shrink-0">
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

// ─── Boutons réseaux sociaux ───────────────────────────────────────────────
function SocialButtons({ socialLinks }: { socialLinks?: SocialLinks }) {
  if (!socialLinks) return null;
  const filled = SOCIAL_CONFIG.filter(
    (s) => socialLinks[s.key as keyof SocialLinks]
  );
  if (filled.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#313442]">
      {filled.map(({ key, label, icon: Icon, color }) => {
        const href = socialLinks[key as keyof SocialLinks]!;
        const isPhone = key === "whatsapp";
        const finalHref = isPhone
          ? `https://wa.me/${href.replace(/\D/g, "")}`
          : href;
        return (
          <a
            key={key}
            href={finalHref}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className="w-7 h-7 rounded-lg bg-[#0F0F12] border border-[#313442] flex items-center justify-center hover:border-[#6C4EA8]/60 hover:bg-[#6C4EA8]/10 transition-all"
          >
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </a>
        );
      })}
    </div>
  );
}

// ─── Card Lien Calendly ───────────────────────────────────────────────────
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
  const roleColors: Record<string, string> = {
    admin: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    manager: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    collaborateur: "text-teal-400 bg-teal-400/10 border-teal-400/20",
  };
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    collaborateur: "Collaborateur",
  };

  const roleColor = roleColors[link.role] || roleColors.collaborateur;
  const initiales = `${link.prenoms?.[0] || ""}${link.nom?.[0] || ""}`.toUpperCase();

  return (
    <div className="group bg-[#1F2128] border border-[#313442] rounded-xl p-5 hover:border-[#6C4EA8]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[#6C4EA8]/5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
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
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${roleColor}`}>
              {roleLabels[link.role] || link.role}
            </span>
          </div>
        </div>

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

      {link.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">
          {link.description}
        </p>
      )}

      {/* Lien */}
      <div className="flex items-center gap-2 bg-[#0F0F12] border border-[#313442] rounded-lg px-3 py-2 mb-4">
        <LinkIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span className="text-gray-400 text-xs truncate">{link.lienCalendly}</span>
      </div>

      {/* Bouton Calendly */}
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

      {/* Réseaux sociaux */}
      <SocialButtons socialLinks={link.socialLinks} />
    </div>
  );
}

// ─── Section principale ───────────────────────────────────────────────────
export function RendezVousSection({ userRole }: RendezVousSectionProps) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<RendezVousLink | null>(null);

  // Collaborateurs peuvent aussi gérer leur lien
  const canManage =
    userRole === "admin" ||
    userRole === "manager" ||
    userRole === "collaborateur";

  const { data: links = [], isLoading } = useQuery<RendezVousLink[]>({
    queryKey: ["rendez-vous"],
    queryFn: rendezVousService.getAllLinks,
  });

  const { data: myLink } = useQuery<RendezVousLink | null>({
    queryKey: ["rendez-vous-me"],
    queryFn: rendezVousService.getMyLink,
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: rendezVousService.createLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rendez-vous"] });
      queryClient.invalidateQueries({ queryKey: ["rendez-vous-me"] });
      setShowModal(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erreur lors de la création du lien");
    },
  });

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

  const handleDelete = (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) return;
    deleteMutation.mutate(id);
  };

  // Séparer par rôle
  const adminLinks = links.filter((l) => l.role === "admin");
  const managerLinks = links.filter((l) => l.role === "manager");
  const collaborateurLinks = links.filter((l) => l.role === "collaborateur");

  const renderSection = (
    title: string,
    sectionLinks: RendezVousLink[],
    badge: string
  ) => {
    if (sectionLinks.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-gray-300 text-sm font-semibold uppercase tracking-wide">
            {title}
          </h2>
          <span className="text-xs bg-[#6C4EA8]/10 text-[#A78BFA] border border-[#6C4EA8]/20 px-2 py-0.5 rounded-full">
            {sectionLinks.length}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionLinks.map((link) => (
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
    );
  };

  return (
    <div className="space-y-6 -mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-extrabold">Rendez-vous</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {canManage
              ? "Gérez votre lien Calendly et consultez les disponibilités"
              : "Prenez rendez-vous avec l'équipe"}
          </p>
        </div>

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

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#313442] border-t-[#6C4EA8] rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm mt-3">Chargement...</p>
          </div>
        </div>
      )}

      {!isLoading && links.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-[#1F2128] border border-[#313442] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white font-medium mb-1">Aucun lien disponible</p>
          <p className="text-gray-500 text-sm">
            {canManage
              ? "Ajoutez votre lien Calendly pour permettre aux autres de prendre rendez-vous."
              : "Aucun lien de prise de rendez-vous n'est disponible pour le moment."}
          </p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-8">
          {renderSection("Administrateurs", adminLinks, "admin")}
          {renderSection("Managers", managerLinks, "manager")}
          {renderSection("Collaborateurs", collaborateurLinks, "collaborateur")}
        </div>
      )}

      {/* Modal Créer */}
      <CalendlyFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        mode="create"
      />

      {/* Modal Modifier */}
      {editingLink && (
        <CalendlyFormModal
          isOpen={true}
          onClose={() => setEditingLink(null)}
          onSubmit={(data) =>
            updateMutation.mutate({ id: editingLink._id, data })
          }
          isLoading={updateMutation.isPending}
          initialData={editingLink}
          mode="edit"
        />
      )}
    </div>
  );
}