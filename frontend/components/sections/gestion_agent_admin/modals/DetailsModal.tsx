"use client";

import type React from "react";
import {
  X,
  Users,
  Briefcase,
  FileText,
  ZoomIn,
  Edit,
  Archive,
  RefreshCw,
} from "lucide-react";
import type { Agent } from "@/lib/users-service";
import { formatDate } from "../utils";
import { getInitials, getAvatarColor } from "../utils";

// Constantes en dur
const MODAL_HEADER_CLASSES = {
  default: "from-violet-600 to-fuchsia-600",
  archive: "from-orange-600 to-amber-600",
  edit: "from-blue-600 to-cyan-600",
  archived: "from-gray-600 to-gray-500",
};

const AVATAR_SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

// Composants UI locaux
function Modal({
  onClose,
  header,
  children,
  maxWidth = "max-w-3xl",
}: any) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`bg-[#1a1c26] border border-[#2e3144] rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}
      >
        <div
          className={`sticky top-0 bg-[#1a1c26] border-b border-[#2e3144] text-white p-4 rounded-t-2xl flex items-center justify-between`}
        >
          {header}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar({
  agent,
  size = "md",
}: {
  agent: Agent;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const photoUrl = (agent as any).profilePhoto?.url;

  return (
    <div
      className={`relative flex-shrink-0 rounded-full overflow-hidden ${AVATAR_SIZES[size]}`}
      style={{ backgroundColor: photoUrl ? undefined : getAvatarColor(agent) }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${agent.prenoms} ${agent.nom}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-white bg-[#6C4EA8]">
          {getInitials(agent)}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: any) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={15} className="text-[#6C4EA8]" />}
      <span className="text-xs font-semibold text-white">
        {children}
      </span>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  className = "",
  variant = "primary",
}: any) {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-3.5 py-2 text-sm h-9";

  const variants: Record<string, string> = {
    primary:
      "bg-violet-600 hover:bg-violet-500 text-white focus:ring-violet-500",
    outline:
      "border border-[#3a3d4e] hover:border-violet-500 text-gray-300 hover:text-white bg-transparent focus:ring-violet-500",
    blue: "border border-blue-500/40 hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500",
    orange:
      "border border-orange-500/40 hover:bg-orange-600 hover:border-orange-600 text-orange-400 hover:text-white focus:ring-orange-500",
    green:
      "border border-green-500/40 hover:bg-green-600 hover:border-green-600 text-green-400 hover:text-white focus:ring-green-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

interface DetailsModalProps {
  agent: Agent;
  onClose: () => void;
  onEdit: (agent: Agent) => void;
  onArchive: (agent: Agent) => void;
  onRestore: (agent: Agent) => void;
  onLightboxOpen: (agent: Agent) => void;
}

export function DetailsModal({
  agent,
  onClose,
  onEdit,
  onArchive,
  onRestore,
  onLightboxOpen,
}: DetailsModalProps) {
  const headerClass = agent.archived
    ? MODAL_HEADER_CLASSES.archived
    : MODAL_HEADER_CLASSES.default;

  return (
    <Modal
      onClose={onClose}
      headerClass={headerClass}
      header={
        <div className="flex items-center gap-3">
          <div
            className="relative group cursor-pointer"
            onClick={() => {
              if ((agent as any).profilePhoto?.url) onLightboxOpen(agent);
            }}
          >
            <Avatar agent={agent} size="lg" />
            {(agent as any).profilePhoto?.url && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={16} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold">
              {agent.prenoms} {agent.nom}
            </h2>
            <p className="text-xs text-white/70 capitalize mt-0.5">
              {agent.profile}
              {agent.archived ? " · archivé" : ""}
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-lg"
    >
      <div className="p-3 sm:p-5 space-y-5">
        {agent.archived && (
          <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-xs text-gray-400">
            Archivé le {agent.archivedAt ? formatDate(agent.archivedAt) : "N/A"}
            {agent.archiveReason && ` — ${agent.archiveReason}`}
          </div>
        )}

        <div>
          <SectionTitle icon={Users}>Informations Personnelles</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ["Email", agent.email],
              ["Téléphone", agent.telephone],
              ["CIN", agent.cin],
              ["Date de naissance", formatDate(agent.dateNaissance)],
              ["Genre", agent.genre],
              ["Adresse", agent.adresse],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] tracking-wider text-white font-semibold">
                  {label}
                </p>
                <p className="text-sm text-gray-600 mt-0.5 break-all">{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle icon={Briefcase}>Professionnel</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ["Poste", agent.poste],
              ...(agent.mission ? [["Mission", agent.mission]] : []),
              ["Date de début", formatDate(agent.dateDebut)],
              ...(!agent.dateFinIndeterminee && agent.dateFin
                ? [["Date de fin", formatDate(agent.dateFin)]]
                : []),
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider text-white font-semibold">
                  {label}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle icon={FileText}>Financier</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agent.profile === "stagiaire" ? (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white font-semibold">
                    Indemnité mensuelle
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {agent.indemnite || 0} Ar
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white font-semibold">
                    Indemnité connexion
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {agent.indemniteConnexion || 0} Ar
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white font-semibold">
                    TJM
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{agent.tjm} Ar</p>
                </div>
                {agent.tjm && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white font-semibold">
                      Tarif journalier
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {agent.tjm} Ar
                    </p>
                  </div>
                )}
                {agent.dureeJournaliere && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white font-semibold">
                      Durée journalière
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {agent.dureeJournaliere}h
                    </p>
                  </div>
                )}
                {agent.domainePrestation && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-white font-semibold">
                      Domaine
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {agent.domainePrestation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#2e3144]">
          <Btn variant="outline" onClick={onClose} className="flex-1">
            Fermer
          </Btn>
          {!agent.archived ? (
            <>
              <Btn
                variant="blue"
                onClick={() => {
                  onClose();
                  onEdit(agent);
                }}
              >
                <Edit size={13} />
                Modifier
              </Btn>
            </>
          ) : (
            <Btn
              variant="green"
              onClick={() => {
                onClose();
                onRestore(agent);
              }}
            >
              <RefreshCw size={13} />
              Restaurer
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}
