"use client";

import type React from "react";
import { useState, useCallback } from "react";
import {
  Eye,
  Phone,
  Users,
  Plus,
  Edit,
  Archive,
  RefreshCw,
  Camera,
} from "lucide-react";
import type { Agent } from "@/lib/users-service";

// Types
import type { AgentsSectionProps, FilterProfileType } from "./types";

// Composants
import { Avatar } from "./Avatar";
import { ProfileBadge } from "./ProfileBadge";
import { PhotoLightbox } from "./PhotoLightbox";
import { PhotoUploadModal } from "./modals/PhotoUploadModal";

// Modals
import { ArchiveModal } from "./modals/ArchiveModal";
import { AddAgentModal } from "./modals/AddAgentModal";
import { EditAgentModal } from "./modals/EditAgentModal";
import { DetailsModal } from "./modals/DetailsModal";

// Constantes en dur
const AVATAR_SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

// Composants UI locaux
function Btn({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
  variant = "primary",
  size = "md",
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?:
    | "primary"
    | "outline"
    | "ghost"
    | "danger"
    | "orange"
    | "green"
    | "blue";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizes = {
    sm: "px-2.5 py-1 text-xs h-7",
    md: "px-3.5 py-2 text-sm h-9",
  };

  const variants: Record<string, string> = {
    primary:
      "bg-violet-600 hover:bg-violet-500 text-white focus:ring-violet-500",
    outline:
      "border border-[#3a3d4e] hover:border-violet-500 text-gray-300 hover:text-white bg-transparent focus:ring-violet-500",
    ghost:
      "text-gray-400 hover:text-white hover:bg-white/10 bg-transparent focus:ring-white/20",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    orange:
      "border border-orange-500/40 hover:bg-orange-600 hover:border-orange-600 text-orange-400 hover:text-white focus:ring-orange-500",
    green:
      "border border-green-500/40 hover:bg-green-600 hover:border-green-600 text-green-400 hover:text-white focus:ring-green-500",
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

function StatCard({ label, value, color, sub }: any) {
  return (
    <div className="bg-[#1F2128] border border-[#313442] rounded-xl p-4">
      <p className="text-xs text-white font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function FilterBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-150 cursor-pointer ${
        active
          ? "bg-[#6C4EA8] text-white"
          : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-[#313442]"
      }`}
    >
      {children}
    </button>
  );
}

export function AgentsSection({
  agents,
  agentsLoading,
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
  const [filterProfile, setFilterProfile] = useState<FilterProfileType>("all");
  const [lightboxAgent, setLightboxAgent] = useState<Agent | null>(null);
  const [photoAgent, setPhotoAgent] = useState<Agent | null>(null);
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);

  const effectiveAgents = localAgents.length ? localAgents : agents;
  const activeAgents = effectiveAgents.filter((a) => !a.archived);
  const archivedAgents = effectiveAgents.filter((a) => a.archived);

  const filteredAgents = effectiveAgents.filter((agent) => {
    if (showArchived && !agent.archived) return false;
    if (!showArchived && agent.archived) return false;
    if (filterProfile !== "all" && agent.profile !== filterProfile)
      return false;
    return true;
  });

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetailsModal(true);
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowEditModal(true);
  };

  const handleArchive = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowArchiveModal(true);
  };

  const handleConfirmArchive = (reason: string) => {
    if (selectedAgent) {
      onArchiveAgent(selectedAgent._id, reason);
      setShowArchiveModal(false);
      setSelectedAgent(null);
    }
  };

  const handleRestore = (agent: Agent) => {
    onRestoreAgent(agent._id);
  };

  const handlePhotoSuccess = useCallback(
    (updated: Agent) => {
      setLocalAgents((prev) => {
        const base = prev.length ? prev : agents;
        return base.map((a) => (a._id === updated._id ? updated : a));
      });
      setPhotoAgent(null);
      if (selectedAgent?._id === updated._id) setSelectedAgent(updated);
    },
    [agents, selectedAgent],
  );

  const handleAgentCreated = () => {
    setShowAddModal(false);
    onAgentCreated?.();
  };

  const handleAgentUpdated = () => {
    setShowEditModal(false);
    onAgentCreated?.();
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 -mt-8">
        <StatCard
          label="Total Agents"
          value={effectiveAgents.length}
          color="text-[#6C4EA8]"
          sub={`${activeAgents.length} actifs · ${archivedAgents.length} archivés`}
        />
        <StatCard
          label="Stagiaires"
          value={activeAgents.filter((a) => a.profile === "stagiaire").length}
          color="text-blue-400"
        />
        <StatCard
          label="Prestataires"
          value={activeAgents.filter((a) => a.profile === "prestataire").length}
          color="text-emerald-400"
        />
        <div className="bg-[#1F2128] border border-[#313442] rounded-xl p-4">
          <p className="text-xs text-white font-medium uppercase tracking-wider mb-2">
            Statut
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Actifs</span>
              <span className="text-xs font-semibold text-green-400">
                {activeAgents.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Archivés</span>
              <span className="text-xs font-semibold text-white">
                {archivedAgents.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1F2128] border border-[#313442] rounded-xl p-3 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <FilterBtn
              active={!showArchived}
              onClick={() => onToggleArchived(false)}
            >
              <Users size={11} className="inline mr-1" />
              Actifs ({activeAgents.length})
            </FilterBtn>
            <FilterBtn
              active={showArchived}
              onClick={() => onToggleArchived(true)}
            >
              <Archive size={11} className="inline mr-1" />
              Archivés ({archivedAgents.length})
            </FilterBtn>
          </div>
          <div className="flex gap-1.5">
            <FilterBtn
              active={filterProfile === "all"}
              onClick={() => setFilterProfile("all")}
            >
              Tous
            </FilterBtn>
            <FilterBtn
              active={filterProfile === "stagiaire"}
              onClick={() => setFilterProfile("stagiaire")}
            >
              Stagiaires
            </FilterBtn>
            <FilterBtn
              active={filterProfile === "prestataire"}
              onClick={() => setFilterProfile("prestataire")}
            >
              Prestataires
            </FilterBtn>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#1F2128] border border-[#313442] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#313442]">
          <div>
            <h2 className="text-base font-semibold text-white">
              {showArchived ? "Agents Archivés" : "Agents Actifs"}
            </h2>
            <p className="text-xs text-white mt-0.5">
              {showArchived
                ? "Ces agents ne sont plus actifs — toutes les données sont conservées"
                : ""}
            </p>
          </div>
          {/* {!showArchived && (
            <Btn onClick={() => setShowAddModal(true)}>
              <Plus size={14} />
              Ajouter
            </Btn>
          )} */}
        </div>

        {agentsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {showArchived ? "Aucun agent archivé" : "Aucun agent trouvé"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#313442]">
                  {[
                    "Agent",
                    "Profil",
                    "Contact",
                    "Poste",
                    ...(showArchived ? ["Archivé le"] : []),
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-white"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent._id}
                    className={`border-b border-[#313442]/50 transition-colors ${
                      agent.archived
                        ? "opacity-60 hover:opacity-80"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Avatar + name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <Avatar
                            agent={agent}
                            size="md"
                            onClick={() => {
                              if ((agent as any).profilePhoto?.url)
                                setLightboxAgent(agent);
                            }}
                            className={
                              (agent as any).profilePhoto?.url
                                ? "ring-2 ring-violet-500/30 hover:ring-violet-500/60"
                                : ""
                            }
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoAgent(agent);
                            }}
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-violet-500"
                            title="Changer la photo"
                          >
                            <Camera size={8} className="text-white" />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">
                            {agent.prenoms} {agent.nom}
                          </p>
                          <p className="text-xs text-white mt-0.5">
                            {agent.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <ProfileBadge agent={agent} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone size={11} className="text-gray-600" />
                        {agent.telephone}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-gray-300">{agent.poste}</p>
                    </td>
                    {showArchived && (
                      <td className="py-3 px-4">
                        <p className="text-xs text-gray-400">
                          {agent.archivedAt
                            ? new Date(agent.archivedAt).toLocaleDateString(
                                "fr-FR",
                              )
                            : "N/A"}
                        </p>
                        {agent.archiveReason && (
                          <p
                            className="text-[10px] text-gray-600 mt-0.5 max-w-[120px] truncate"
                            title={agent.archiveReason}
                          >
                            {agent.archiveReason}
                          </p>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Btn
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(agent)}
                        >
                          <Eye size={11} />
                          Détails
                        </Btn>
                        {!agent.archived ? (
                          <>
                            <Btn
                              size="sm"
                              variant="blue"
                              onClick={() => handleEdit(agent)}
                            >
                              <Edit size={11} />
                              Modifier
                            </Btn>
                            <Btn
                              size="sm"
                              variant="orange"
                              onClick={() => handleArchive(agent)}
                              disabled={archiveAgentPending}
                            >
                              <Archive size={11} />
                              Archiver
                            </Btn>
                          </>
                        ) : (
                          <Btn
                            size="sm"
                            variant="green"
                            onClick={() => handleRestore(agent)}
                            disabled={archiveAgentPending}
                          >
                            <RefreshCw size={11} />
                            Restaurer
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

      {/* Modals */}
      {lightboxAgent && (
        <PhotoLightbox
          agent={lightboxAgent}
          onClose={() => setLightboxAgent(null)}
        />
      )}

      {photoAgent && (
        <PhotoUploadModal
          agent={photoAgent}
          onClose={() => setPhotoAgent(null)}
          onSuccess={handlePhotoSuccess}
        />
      )}

      {showArchiveModal && selectedAgent && (
        <ArchiveModal
          agent={selectedAgent}
          onClose={() => {
            setShowArchiveModal(false);
            setSelectedAgent(null);
          }}
          onConfirm={handleConfirmArchive}
          isPending={archiveAgentPending}
        />
      )}

      {showAddModal && (
        <AddAgentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAgentCreated}
        />
      )}

      {showEditModal && selectedAgent && (
        <EditAgentModal
          agent={selectedAgent}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleAgentUpdated}
        />
      )}

      {showDetailsModal && selectedAgent && (
        <DetailsModal
          agent={selectedAgent}
          onClose={() => setShowDetailsModal(false)}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onLightboxOpen={setLightboxAgent}
        />
      )}
    </>
  );
}
