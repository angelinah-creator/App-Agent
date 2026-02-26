"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import {
  Eye,
  Phone,
  X,
  Users,
  FileText,
  Plus,
  Edit,
  Archive,
  RefreshCw,
  Briefcase,
  Camera,
  Trash2,
  ZoomIn,
  ChevronDown,
} from "lucide-react";
import type {
  Agent,
  CreateAgentDto,
  Genre,
  UserProfile,
} from "@/lib/users-service";
import { usersService } from "@/lib/users-service";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(agent: Agent): string {
  const p = (agent.prenoms || "").trim()[0] || "";
  const n = (agent.nom || "").trim()[0] || "";
  return (p + n).toUpperCase() || "?";
}

function getAvatarColor(agent: Agent): string {
  const colors = [
    "#7C3AED", "#2563EB", "#059669", "#D97706",
    "#DC2626", "#7C3AED", "#0891B2", "#65A30D",
  ];
  const idx = (agent._id || "").charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── Primitive UI pieces (no shadcn) ────────────────────────────────────────

function Btn({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "outline" | "ghost" | "danger" | "orange" | "green" | "blue";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const sizes = { sm: "px-2.5 py-1 text-xs h-7", md: "px-3.5 py-2 text-sm h-9" };
  const variants: Record<string, string> = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white focus:ring-violet-500",
    outline: "border border-[#3a3d4e] hover:border-violet-500 text-gray-300 hover:text-white bg-transparent focus:ring-violet-500",
    ghost: "text-gray-400 hover:text-white hover:bg-white/10 bg-transparent focus:ring-white/20",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    orange: "border border-orange-500/40 hover:bg-orange-600 hover:border-orange-600 text-orange-400 hover:text-white focus:ring-orange-500",
    green: "border border-green-500/40 hover:bg-green-600 hover:border-green-600 text-green-400 hover:text-white focus:ring-green-500",
    blue: "border border-blue-500/40 hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Inp({
  id, value, onChange, type = "text", required, disabled, placeholder, className = "",
}: {
  id?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; disabled?: boolean; placeholder?: string; className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full h-8 px-3 text-sm bg-[#13141b] border border-[#3a3d4e] text-white rounded-lg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50 placeholder:text-gray-600 transition-colors ${className}`}
    />
  );
}

function Sel({
  id, value, onChange, children,
}: {
  id?: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-3 pr-8 text-sm bg-[#13141b] border border-[#3a3d4e] text-white rounded-lg appearance-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
    </div>
  );
}

function Lbl({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-400 mb-1">{children}</label>;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <Lbl htmlFor={htmlFor}>{label}</Lbl>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={15} className="text-violet-400" />}
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{children}</span>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  agent,
  size = "md",
  onClick,
  className = "",
}: {
  agent: Agent;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  className?: string;
}) {
  const dims = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-lg", xl: "w-24 h-24 text-2xl" };
  const photoUrl = (agent as any).profilePhoto?.url;

  return (
    <div
      className={`relative flex-shrink-0 rounded-full overflow-hidden ${dims[size]} ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className}`}
      onClick={onClick}
      style={{ backgroundColor: photoUrl ? undefined : getAvatarColor(agent) }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={`${agent.prenoms} ${agent.nom}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-white">
          {getInitials(agent)}
        </div>
      )}
      {agent.archived && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Archive size={size === "sm" ? 10 : size === "md" ? 13 : 20} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function PhotoLightbox({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const photoUrl = (agent as any).profilePhoto?.url;
  if (!photoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <img
            src={photoUrl}
            alt={`${agent.prenoms} ${agent.nom}`}
            className="w-full h-auto max-h-[80vh] object-contain bg-[#0d0e13]"
          />
        </div>
        <p className="text-center text-white/70 text-sm mt-3 font-medium">
          {agent.prenoms} {agent.nom}
        </p>
      </div>
    </div>
  );
}

// ─── Photo Upload Modal ───────────────────────────────────────────────────────

function PhotoUploadModal({
  agent,
  onClose,
  onSuccess,
}: {
  agent: Agent;
  onClose: () => void;
  onSuccess: (updated: Agent) => void;
}) {
  const [preview, setPreview] = useState<string | null>((agent as any).profilePhoto?.url || null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await usersService.uploadProfilePhoto(agent._id, file);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await usersService.deleteProfilePhoto(agent._id);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1c26] border border-[#2e3144] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#2e3144]">
          <h3 className="text-sm font-semibold text-white">Photo de profil</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-[#3a3d4e] flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{ backgroundColor: preview ? undefined : getAvatarColor(agent) }}
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-white">
                  <span className="text-3xl font-bold">{getInitials(agent)}</span>
                  <Camera size={16} className="opacity-60" />
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            Cliquez ou glissez une image pour changer la photo
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2">
            {(agent as any).profilePhoto?.url && (
              <Btn variant="danger" onClick={handleDelete} disabled={loading} className="flex-1">
                <Trash2 size={13} />
                Supprimer
              </Btn>
            )}
            <Btn
              variant="primary"
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1"
            >
              {loading ? "Upload..." : "Enregistrer"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Props ───────────────────────────────────────────────────────────────

interface AgentsSectionProps {
  agents: Agent[];
  agentsLoading: boolean;
  stats?: any;
  onArchiveAgent: (agentId: string, archiveReason?: string) => void;
  onRestoreAgent: (agentId: string) => void;
  archiveAgentPending: boolean;
  onAgentCreated?: () => void;
  onAgentProfileChanged?: () => void;
  showArchived: boolean;
  onToggleArchived: (show: boolean) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentsSection({
  agents,
  agentsLoading,
  stats,
  onArchiveAgent,
  onRestoreAgent,
  archiveAgentPending,
  onAgentCreated,
  showArchived,
  onToggleArchived,
}: AgentsSectionProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [filterProfile, setFilterProfile] = useState<"all" | "stagiaire" | "prestataire">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxAgent, setLightboxAgent] = useState<Agent | null>(null);
  const [photoAgent, setPhotoAgent] = useState<Agent | null>(null);
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);

  const effectiveAgents = localAgents.length ? localAgents : agents;
  const [formData, setFormData] = useState<CreateAgentDto>({
    profile: "stagiaire" as UserProfile,
    nom: "", prenoms: "", dateNaissance: "", genre: "Homme" as Genre,
    adresse: "", cin: "", poste: "", dateDebut: "", dateFinIndeterminee: false,
    tjm: 0, telephone: "", email: "", password: "",
  });
  const [editFormData, setEditFormData] = useState<any>({});

  const activeAgents = effectiveAgents.filter((a) => !a.archived);
  const archivedAgents = effectiveAgents.filter((a) => a.archived);

  const filteredAgents = effectiveAgents.filter((agent) => {
    if (showArchived && !agent.archived) return false;
    if (!showArchived && agent.archived) return false;
    if (filterProfile !== "all" && agent.profile !== filterProfile) return false;
    return true;
  });

  const handleViewDetails = (agent: Agent) => { setSelectedAgent(agent); setShowDetailsModal(true); };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    const d: any = {
      nom: agent.nom || "", prenoms: agent.prenoms || "", email: agent.email || "",
      telephone: agent.telephone || "", adresse: agent.adresse || "", poste: agent.poste || "",
      dateDebut: agent.dateDebut, dateFinIndeterminee: Boolean(agent.dateFinIndeterminee),
    };
    if (agent.dateFin?.trim()) {
      d.dateFin = agent.dateFin.includes("T") ? agent.dateFin : `${agent.dateFin}T00:00:00.000Z`;
    } else { d.dateFin = null; }
    if (agent.mission) d.mission = agent.mission;
    if (agent.domainePrestation) d.domainePrestation = agent.domainePrestation;
    if (agent.profile === "stagiaire") {
      if (agent.indemnite !== undefined) d.indemnite = Number(agent.indemnite);
      if (agent.indemniteConnexion !== undefined) d.indemniteConnexion = Number(agent.indemniteConnexion);
    } else if (agent.profile === "prestataire") {
      if (agent.tjm !== undefined) d.tjm = Number(agent.tjm);
      if (agent.tarifJournalier !== undefined) d.tarifJournalier = Number(agent.tarifJournalier);
      if (agent.dureeJournaliere !== undefined) d.dureeJournaliere = Number(agent.dureeJournaliere);
    }
    setEditFormData(d);
    setShowEditModal(true);
  };

  const handleArchive = (agent: Agent) => { setSelectedAgent(agent); setShowArchiveModal(true); };

  const handleConfirmArchive = () => {
    if (selectedAgent) {
      onArchiveAgent(selectedAgent._id, archiveReason);
      setShowArchiveModal(false); setArchiveReason(""); setSelectedAgent(null);
    }
  };

  const handleRestore = (agent: Agent) => { onRestoreAgent(agent._id); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await usersService.createAgent(formData);
      setShowAddModal(false);
      setFormData({ profile: "stagiaire" as UserProfile, nom: "", prenoms: "", dateNaissance: "", genre: "Homme" as Genre, adresse: "", cin: "", poste: "", dateDebut: "", dateFinIndeterminee: false, tjm: 0, telephone: "", email: "", password: "" });
      onAgentCreated?.();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de l'agent");
    } finally { setIsSubmitting(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      if (selectedAgent) {
        await usersService.updateAgent(selectedAgent._id, editFormData);
        setShowEditModal(false); onAgentCreated?.();
      }
    } catch (error) { console.error(error); }
    finally { setIsSubmitting(false); }
  };

  const handlePhotoSuccess = useCallback((updated: Agent) => {
    setLocalAgents((prev) => {
      const base = prev.length ? prev : agents;
      return base.map((a) => (a._id === updated._id ? updated : a));
    });
    setPhotoAgent(null);
    if (selectedAgent?._id === updated._id) setSelectedAgent(updated);
  }, [agents, selectedAgent]);

  // ── Stat Cards ──────────────────────────────────────────────────────────────
  const StatCard = ({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) => (
    <div className="bg-[#1a1c26] border border-[#2e3144] rounded-xl p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );

  // ── Badge ───────────────────────────────────────────────────────────────────
  const ProfileBadge = ({ agent }: { agent: Agent }) => {
    if (agent.archived) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-700/50 text-gray-400 border border-gray-600/30 capitalize">{agent.profile} · archivé</span>;
    if (agent.profile === "stagiaire") return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">Stagiaire</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">Prestataire</span>;
  };

  // ── Filter Btn ──────────────────────────────────────────────────────────────
  const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer ${active ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-[#2e3144]"}`}
    >
      {children}
    </button>
  );

  // ── Modal Wrapper ───────────────────────────────────────────────────────────
  const Modal = ({ onClose, header, headerClass = "from-violet-600 to-fuchsia-600", children, maxWidth = "max-w-3xl" }: {
    onClose: () => void; header: React.ReactNode; headerClass?: string; children: React.ReactNode; maxWidth?: string;
  }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-[#1a1c26] border border-[#2e3144] rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 bg-gradient-to-r ${headerClass} text-white p-4 rounded-t-2xl flex items-center justify-between`}>
          {header}
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 -mt-8">
        <StatCard label="Total Agents" value={effectiveAgents.length} color="text-violet-400" sub={`${activeAgents.length} actifs · ${archivedAgents.length} archivés`} />
        <StatCard label="Stagiaires" value={activeAgents.filter((a) => a.profile === "stagiaire").length} color="text-blue-400" />
        <StatCard label="Prestataires" value={activeAgents.filter((a) => a.profile === "prestataire").length} color="text-emerald-400" />
        <div className="bg-[#1a1c26] border border-[#2e3144] rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Statut</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Actifs</span>
              <span className="text-xs font-semibold text-green-400">{activeAgents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Archivés</span>
              <span className="text-xs font-semibold text-gray-500">{archivedAgents.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-[#1a1c26] border border-[#2e3144] rounded-xl p-3 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <FilterBtn active={!showArchived} onClick={() => onToggleArchived(false)}>
              <Users size={11} className="inline mr-1" />Actifs ({activeAgents.length})
            </FilterBtn>
            <FilterBtn active={showArchived} onClick={() => onToggleArchived(true)}>
              <Archive size={11} className="inline mr-1" />Archivés ({archivedAgents.length})
            </FilterBtn>
          </div>
          <div className="flex gap-1.5">
            <FilterBtn active={filterProfile === "all"} onClick={() => setFilterProfile("all")}>Tous</FilterBtn>
            <FilterBtn active={filterProfile === "stagiaire"} onClick={() => setFilterProfile("stagiaire")}>Stagiaires</FilterBtn>
            <FilterBtn active={filterProfile === "prestataire"} onClick={() => setFilterProfile("prestataire")}>Prestataires</FilterBtn>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-[#1a1c26] border border-[#2e3144] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#2e3144]">
          <div>
            <h2 className="text-base font-semibold text-white">{showArchived ? "Agents Archivés" : "Agents Actifs"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {showArchived ? "Ces agents ne sont plus actifs — toutes les données sont conservées" : "Gérez vos stagiaires et prestataires"}
            </p>
          </div>
          {!showArchived && (
            <Btn onClick={() => setShowAddModal(true)}>
              <Plus size={14} />Ajouter
            </Btn>
          )}
        </div>

        {agentsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{showArchived ? "Aucun agent archivé" : "Aucun agent trouvé"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2e3144]">
                  {["Agent", "Profil", "Contact", "Poste", ...(showArchived ? ["Archivé le"] : []), "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent._id}
                    className={`border-b border-[#2e3144]/50 transition-colors ${agent.archived ? "opacity-60 hover:opacity-80" : "hover:bg-white/[0.02]"}`}
                  >
                    {/* Avatar + name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <Avatar
                            agent={agent}
                            size="md"
                            onClick={() => {
                              if ((agent as any).profilePhoto?.url) setLightboxAgent(agent);
                            }}
                            className={(agent as any).profilePhoto?.url ? "ring-2 ring-violet-500/30 hover:ring-violet-500/60" : ""}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); setPhotoAgent(agent); }}
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-violet-500"
                            title="Changer la photo"
                          >
                            <Camera size={8} className="text-white" />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">{agent.prenoms} {agent.nom}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><ProfileBadge agent={agent} /></td>
                    <td className="py-3 px-4">
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone size={11} className="text-gray-600" />{agent.telephone}
                      </p>
                    </td>
                    <td className="py-3 px-4"><p className="text-xs text-gray-300">{agent.poste}</p></td>
                    {showArchived && (
                      <td className="py-3 px-4">
                        <p className="text-xs text-gray-400">
                          {agent.archivedAt ? new Date(agent.archivedAt).toLocaleDateString("fr-FR") : "N/A"}
                        </p>
                        {agent.archiveReason && <p className="text-[10px] text-gray-600 mt-0.5 max-w-[120px] truncate" title={agent.archiveReason}>{agent.archiveReason}</p>}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Btn size="sm" variant="outline" onClick={() => handleViewDetails(agent)}>
                          <Eye size={11} />Détails
                        </Btn>
                        {!agent.archived ? (
                          <>
                            <Btn size="sm" variant="blue" onClick={() => handleEdit(agent)}>
                              <Edit size={11} />
                            </Btn>
                            <Btn size="sm" variant="orange" onClick={() => handleArchive(agent)} disabled={archiveAgentPending}>
                              <Archive size={11} />
                            </Btn>
                          </>
                        ) : (
                          <Btn size="sm" variant="green" onClick={() => handleRestore(agent)} disabled={archiveAgentPending}>
                            <RefreshCw size={11} />Restaurer
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxAgent && <PhotoLightbox agent={lightboxAgent} onClose={() => setLightboxAgent(null)} />}

      {/* ── Photo Upload Modal ── */}
      {photoAgent && (
        <PhotoUploadModal
          agent={photoAgent}
          onClose={() => setPhotoAgent(null)}
          onSuccess={handlePhotoSuccess}
        />
      )}

      {/* ── Archive Modal ── */}
      {showArchiveModal && selectedAgent && (
        <Modal
          onClose={() => { setShowArchiveModal(false); setArchiveReason(""); setSelectedAgent(null); }}
          headerClass="from-orange-600 to-amber-600"
          header={<div><h2 className="text-sm font-bold">Archiver l'agent</h2><p className="text-xs text-orange-200 mt-0.5">{selectedAgent.prenoms} {selectedAgent.nom}</p></div>}
          maxWidth="max-w-sm"
        >
          <div className="p-4 space-y-3">
            <Field label="Raison de l'archivage (optionnel)" htmlFor="archiveReason">
              <Inp id="archiveReason" value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} placeholder="Ex: Fin de contrat, départ…" />
            </Field>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
              L'agent sera marqué comme archivé. Toutes ses données seront conservées.
            </div>
            <div className="flex gap-2 pt-2">
              <Btn variant="outline" onClick={() => { setShowArchiveModal(false); setArchiveReason(""); setSelectedAgent(null); }} disabled={archiveAgentPending} className="flex-1">Annuler</Btn>
              <Btn onClick={handleConfirmArchive} disabled={archiveAgentPending} className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 border-0">
                {archiveAgentPending ? "Archivage…" : "Confirmer"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Modal ── */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} header={<h2 className="text-sm font-bold">Ajouter un agent</h2>}>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Base */}
            <div>
              <SectionTitle icon={Users}>Informations de base</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Profil *" htmlFor="profile">
                  <Sel id="profile" value={formData.profile} onChange={(v) => setFormData({ ...formData, profile: v as UserProfile })}>
                    <option value="stagiaire">Stagiaire</option>
                    <option value="prestataire">Prestataire</option>
                    <option value="admin">Admin</option>
                  </Sel>
                </Field>
                <Field label="Nom *" htmlFor="nom"><Inp id="nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required /></Field>
                <Field label="Prénoms *" htmlFor="prenoms"><Inp id="prenoms" value={formData.prenoms} onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })} required /></Field>
                <Field label="Genre *" htmlFor="genre">
                  <Sel id="genre" value={formData.genre} onChange={(v) => setFormData({ ...formData, genre: v as Genre })}>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </Sel>
                </Field>
                <Field label="Date de naissance *" htmlFor="dateNaissance"><Inp id="dateNaissance" type="date" value={formData.dateNaissance} onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })} required /></Field>
                <Field label="CIN *" htmlFor="cin"><Inp id="cin" value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} required /></Field>
              </div>
            </div>

            {/* Contact */}
            <div>
              <SectionTitle icon={Phone}>Contact</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email *" htmlFor="email"><Inp id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></Field>
                <Field label="Téléphone *" htmlFor="telephone"><Inp id="telephone" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} required /></Field>
                <div className="col-span-2"><Field label="Adresse *" htmlFor="adresse"><Inp id="adresse" value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} required /></Field></div>
                <Field label="Mot de passe *" htmlFor="password"><Inp id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required /></Field>
              </div>
            </div>

            {/* Pro */}
            <div>
              <SectionTitle icon={Briefcase}>Professionnel</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Poste *" htmlFor="poste"><Inp id="poste" value={formData.poste} onChange={(e) => setFormData({ ...formData, poste: e.target.value })} required /></Field>
                <Field label="Mission" htmlFor="mission"><Inp id="mission" value={formData.mission || ""} onChange={(e) => setFormData({ ...formData, mission: e.target.value })} /></Field>
                <Field label="Date de début *" htmlFor="dateDebut"><Inp id="dateDebut" type="date" value={formData.dateDebut} onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })} required /></Field>
                <Field label="Date de fin" htmlFor="dateFin"><Inp id="dateFin" type="date" value={formData.dateFin || ""} onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })} disabled={formData.dateFinIndeterminee} /></Field>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="dateFinIndeterminee" checked={formData.dateFinIndeterminee} onChange={(e) => setFormData({ ...formData, dateFinIndeterminee: e.target.checked })} className="w-3.5 h-3.5 accent-violet-500 cursor-pointer" />
                  <label htmlFor="dateFinIndeterminee" className="text-xs text-gray-400 cursor-pointer">Date de fin indéterminée</label>
                </div>
              </div>
            </div>

            {/* Finance */}
            <div>
              <SectionTitle icon={FileText}>Financier</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {formData.profile === "stagiaire" ? (
                  <>
                    <Field label="Indemnité mensuelle" htmlFor="indemnite"><Inp id="indemnite" type="number" value={formData.indemnite || ""} onChange={(e) => setFormData({ ...formData, indemnite: Number(e.target.value) })} /></Field>
                    <Field label="Indemnité connexion" htmlFor="indemniteConnexion"><Inp id="indemniteConnexion" type="number" value={formData.indemniteConnexion || ""} onChange={(e) => setFormData({ ...formData, indemniteConnexion: Number(e.target.value) })} /></Field>
                  </>
                ) : (
                  <>
                    <Field label="TJM *" htmlFor="tjm"><Inp id="tjm" type="number" value={formData.tjm} onChange={(e) => setFormData({ ...formData, tjm: Number(e.target.value) })} required /></Field>
                    <Field label="Tarif journalier" htmlFor="tarifJournalier"><Inp id="tarifJournalier" type="number" value={formData.tarifJournalier || ""} onChange={(e) => setFormData({ ...formData, tarifJournalier: Number(e.target.value) })} /></Field>
                    <Field label="Durée journalière (h)" htmlFor="dureeJournaliere"><Inp id="dureeJournaliere" type="number" value={formData.dureeJournaliere || ""} onChange={(e) => setFormData({ ...formData, dureeJournaliere: Number(e.target.value) })} /></Field>
                    <Field label="Domaine de prestation" htmlFor="domainePrestation"><Inp id="domainePrestation" value={formData.domainePrestation || ""} onChange={(e) => setFormData({ ...formData, domainePrestation: e.target.value })} /></Field>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2e3144]">
              <Btn variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting} className="flex-1">Annuler</Btn>
              <Btn type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? "Création…" : "Créer l'agent"}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && selectedAgent && (
        <Modal
          onClose={() => setShowEditModal(false)}
          headerClass="from-blue-600 to-cyan-600"
          header={
            <div className="flex items-center gap-3">
              <Avatar agent={selectedAgent} size="md" />
              <div>
                <h2 className="text-sm font-bold">Modifier {selectedAgent.prenoms} {selectedAgent.nom}</h2>
                <p className="text-xs text-blue-200 capitalize">{selectedAgent.profile}</p>
              </div>
            </div>
          }
        >
          <form onSubmit={handleEditSubmit} className="p-5 space-y-5">
            <div>
              <SectionTitle icon={Users}>Informations de base</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom *" htmlFor="edit-nom"><Inp id="edit-nom" value={editFormData.nom || ""} onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })} required /></Field>
                <Field label="Prénoms *" htmlFor="edit-prenoms"><Inp id="edit-prenoms" value={editFormData.prenoms || ""} onChange={(e) => setEditFormData({ ...editFormData, prenoms: e.target.value })} required /></Field>
              </div>
            </div>
            <div>
              <SectionTitle icon={Phone}>Contact</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email *" htmlFor="edit-email"><Inp id="edit-email" type="email" value={editFormData.email || ""} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} required /></Field>
                <Field label="Téléphone *" htmlFor="edit-telephone"><Inp id="edit-telephone" value={editFormData.telephone || ""} onChange={(e) => setEditFormData({ ...editFormData, telephone: e.target.value })} required /></Field>
                <div className="col-span-2"><Field label="Adresse *" htmlFor="edit-adresse"><Inp id="edit-adresse" value={editFormData.adresse || ""} onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })} required /></Field></div>
              </div>
            </div>
            <div>
              <SectionTitle icon={Briefcase}>Professionnel</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Poste *" htmlFor="edit-poste"><Inp id="edit-poste" value={editFormData.poste || ""} onChange={(e) => setEditFormData({ ...editFormData, poste: e.target.value })} required /></Field>
                <Field label="Mission" htmlFor="edit-mission"><Inp id="edit-mission" value={editFormData.mission || ""} onChange={(e) => setEditFormData({ ...editFormData, mission: e.target.value })} /></Field>
                <Field label="Date de début *" htmlFor="edit-dateDebut"><Inp id="edit-dateDebut" type="date" value={editFormData.dateDebut?.split("T")[0] || ""} onChange={(e) => setEditFormData({ ...editFormData, dateDebut: e.target.value ? `${e.target.value}T00:00:00.000Z` : "" })} required /></Field>
                <Field label="Date de fin" htmlFor="edit-dateFin"><Inp id="edit-dateFin" type="date" value={editFormData.dateFin?.split("T")[0] || ""} onChange={(e) => setEditFormData({ ...editFormData, dateFin: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })} disabled={editFormData.dateFinIndeterminee} /></Field>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="edit-dateFinIndeterminee" checked={editFormData.dateFinIndeterminee || false} onChange={(e) => setEditFormData({ ...editFormData, dateFinIndeterminee: e.target.checked })} className="w-3.5 h-3.5 accent-violet-500 cursor-pointer" />
                  <label htmlFor="edit-dateFinIndeterminee" className="text-xs text-gray-400 cursor-pointer">Date de fin indéterminée</label>
                </div>
              </div>
            </div>
            <div>
              <SectionTitle icon={FileText}>Financier</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {selectedAgent.profile === "stagiaire" ? (
                  <>
                    <Field label="Indemnité mensuelle" htmlFor="edit-indemnite"><Inp id="edit-indemnite" type="number" value={editFormData.indemnite || 0} onChange={(e) => setEditFormData({ ...editFormData, indemnite: Number(e.target.value) })} /></Field>
                    <Field label="Indemnité connexion" htmlFor="edit-indemniteConnexion"><Inp id="edit-indemniteConnexion" type="number" value={editFormData.indemniteConnexion || 0} onChange={(e) => setEditFormData({ ...editFormData, indemniteConnexion: Number(e.target.value) })} /></Field>
                  </>
                ) : (
                  <>
                    <Field label="TJM *" htmlFor="edit-tjm"><Inp id="edit-tjm" type="number" value={editFormData.tjm || 0} onChange={(e) => setEditFormData({ ...editFormData, tjm: Number(e.target.value) })} required /></Field>
                    <Field label="Tarif journalier" htmlFor="edit-tarifJournalier"><Inp id="edit-tarifJournalier" type="number" value={editFormData.tarifJournalier || 0} onChange={(e) => setEditFormData({ ...editFormData, tarifJournalier: Number(e.target.value) })} /></Field>
                    <Field label="Durée journalière (h)" htmlFor="edit-dureeJournaliere"><Inp id="edit-dureeJournaliere" type="number" value={editFormData.dureeJournaliere || 0} onChange={(e) => setEditFormData({ ...editFormData, dureeJournaliere: Number(e.target.value) })} /></Field>
                    <Field label="Domaine de prestation" htmlFor="edit-domainePrestation"><Inp id="edit-domainePrestation" value={editFormData.domainePrestation || ""} onChange={(e) => setEditFormData({ ...editFormData, domainePrestation: e.target.value })} /></Field>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#2e3144]">
              <Btn variant="outline" onClick={() => setShowEditModal(false)} disabled={isSubmitting} className="flex-1">Annuler</Btn>
              <Btn type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0">{isSubmitting ? "Modification…" : "Modifier"}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Details Modal ── */}
      {showDetailsModal && selectedAgent && (
        <Modal
          onClose={() => setShowDetailsModal(false)}
          headerClass={selectedAgent.archived ? "from-gray-600 to-gray-500" : "from-violet-600 to-fuchsia-600"}
          header={
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => { if ((selectedAgent as any).profilePhoto?.url) setLightboxAgent(selectedAgent); }}>
                <Avatar agent={selectedAgent} size="lg" />
                {(selectedAgent as any).profilePhoto?.url && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn size={16} className="text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-base font-bold">{selectedAgent.prenoms} {selectedAgent.nom}</h2>
                <p className="text-xs text-white/70 capitalize mt-0.5">{selectedAgent.profile}{selectedAgent.archived ? " · archivé" : ""}</p>
              </div>
            </div>
          }
          maxWidth="max-w-lg"
        >
          <div className="p-5 space-y-5">
            {selectedAgent.archived && (
              <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-xs text-gray-400">
                Archivé le {selectedAgent.archivedAt ? new Date(selectedAgent.archivedAt).toLocaleDateString("fr-FR") : "N/A"}
                {selectedAgent.archiveReason && ` — ${selectedAgent.archiveReason}`}
              </div>
            )}

            <div>
              <SectionTitle icon={Users}>Informations Personnelles</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Email", selectedAgent.email],
                  ["Téléphone", selectedAgent.telephone],
                  ["CIN", selectedAgent.cin],
                  ["Date de naissance", new Date(selectedAgent.dateNaissance).toLocaleDateString("fr-FR")],
                  ["Genre", selectedAgent.genre],
                  ["Adresse", selectedAgent.adresse],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">{label}</p>
                    <p className="text-sm text-white mt-0.5 break-all">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle icon={Briefcase}>Professionnel</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Poste", selectedAgent.poste],
                  ...(selectedAgent.mission ? [["Mission", selectedAgent.mission]] : []),
                  ["Date de début", new Date(selectedAgent.dateDebut).toLocaleDateString("fr-FR")],
                  ...(!selectedAgent.dateFinIndeterminee && selectedAgent.dateFin ? [["Date de fin", new Date(selectedAgent.dateFin).toLocaleDateString("fr-FR")]] : []),
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">{label}</p>
                    <p className="text-sm text-white mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle icon={FileText}>Financier</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {selectedAgent.profile === "stagiaire" ? (
                  <>
                    <div><p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Indemnité mensuelle</p><p className="text-sm text-white mt-0.5">{selectedAgent.indemnite || 0} Ar</p></div>
                    <div><p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Indemnité connexion</p><p className="text-sm text-white mt-0.5">{selectedAgent.indemniteConnexion || 0} Ar</p></div>
                  </>
                ) : (
                  <>
                    <div><p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">TJM</p><p className="text-sm text-white mt-0.5">{selectedAgent.tjm} Ar</p></div>
                    {selectedAgent.tarifJournalier && <div><p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Tarif journalier</p><p className="text-sm text-white mt-0.5">{selectedAgent.tarifJournalier} Ar</p></div>}
                    {selectedAgent.dureeJournaliere && <div><p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Durée journalière</p><p className="text-sm text-white mt-0.5">{selectedAgent.dureeJournaliere}h</p></div>}
                    {selectedAgent.domainePrestation && <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Domaine</p><p className="text-sm text-white mt-0.5">{selectedAgent.domainePrestation}</p></div>}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2e3144]">
              <Btn variant="outline" onClick={() => setShowDetailsModal(false)} className="flex-1">Fermer</Btn>
              {!selectedAgent.archived ? (
                <>
                  <Btn variant="blue" onClick={() => { setShowDetailsModal(false); handleEdit(selectedAgent); }}>
                    <Edit size={13} />Modifier
                  </Btn>
                  <Btn variant="orange" onClick={() => { setShowDetailsModal(false); handleArchive(selectedAgent); }}>
                    <Archive size={13} />Archiver
                  </Btn>
                </>
              ) : (
                <Btn variant="green" onClick={() => { setShowDetailsModal(false); handleRestore(selectedAgent); }}>
                  <RefreshCw size={13} />Restaurer
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}