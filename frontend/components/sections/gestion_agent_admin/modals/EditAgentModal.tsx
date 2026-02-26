"use client";

import type React from "react";
import { useState } from "react";
import {
  X,
  Users,
  Phone,
  Briefcase,
  FileText,
  ChevronDown,
} from "lucide-react";
import type { Agent } from "@/lib/users-service";
import { usersService } from "@/lib/users-service";
import type { EditFormDataType } from "../types";
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
  headerClass = "from-violet-600 to-fuchsia-600",
  children,
  maxWidth = "max-w-3xl",
}: any) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`bg-[#1a1c26] border border-[#2e3144] rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}
      >
        <div
          className={`sticky top-0 bg-gradient-to-r ${headerClass} text-white p-4 rounded-t-2xl flex items-center justify-between`}
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
        <div className="w-full h-full flex items-center justify-center font-bold text-white">
          {getInitials(agent)}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: any) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={15} className="text-violet-400" />}
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {children}
      </span>
    </div>
  );
}

function Field({ label, htmlFor, children }: any) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-gray-400 mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Inp({
  id,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  placeholder,
}: any) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full h-8 px-3 text-sm bg-[#13141b] border border-[#3a3d4e] text-white rounded-lg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50 placeholder:text-gray-600 transition-colors"
    />
  );
}

function Btn({
  children,
  onClick,
  type = "button",
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
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

interface EditAgentModalProps {
  agent: Agent;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAgentModal({
  agent,
  onClose,
  onSuccess,
}: EditAgentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EditFormDataType>(() => {
    const d: EditFormDataType = {
      nom: agent.nom || "",
      prenoms: agent.prenoms || "",
      email: agent.email || "",
      telephone: agent.telephone || "",
      adresse: agent.adresse || "",
      poste: agent.poste || "",
      dateDebut: agent.dateDebut,
      dateFinIndeterminee: Boolean(agent.dateFinIndeterminee),
    };

    if (agent.dateFin?.trim()) {
      d.dateFin = agent.dateFin.includes("T")
        ? agent.dateFin
        : `${agent.dateFin}T00:00:00.000Z`;
    } else {
      d.dateFin = null;
    }

    if (agent.mission) d.mission = agent.mission;
    if (agent.domainePrestation) d.domainePrestation = agent.domainePrestation;

    if (agent.profile === "stagiaire") {
      if (agent.indemnite !== undefined) d.indemnite = Number(agent.indemnite);
      if (agent.indemniteConnexion !== undefined)
        d.indemniteConnexion = Number(agent.indemniteConnexion);
    } else if (agent.profile === "prestataire") {
      if (agent.tjm !== undefined) d.tjm = Number(agent.tjm);
      if (agent.tarifJournalier !== undefined)
        d.tarifJournalier = Number(agent.tarifJournalier);
      if (agent.dureeJournaliere !== undefined)
        d.dureeJournaliere = Number(agent.dureeJournaliere);
    }

    return d;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await usersService.updateAgent(agent._id, formData);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la modification de l'agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      headerClass={MODAL_HEADER_CLASSES.edit}
      header={
        <div className="flex items-center gap-3">
          <Avatar agent={agent} size="md" />
          <div>
            <h2 className="text-sm font-bold">
              Modifier {agent.prenoms} {agent.nom}
            </h2>
            <p className="text-xs text-blue-200 capitalize">{agent.profile}</p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <div>
          <SectionTitle icon={Users}>Informations de base</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom *" htmlFor="edit-nom">
              <Inp
                id="edit-nom"
                value={formData.nom || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Prénoms *" htmlFor="edit-prenoms">
              <Inp
                id="edit-prenoms"
                value={formData.prenoms || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, prenoms: e.target.value })
                }
                required
              />
            </Field>
          </div>
        </div>

        <div>
          <SectionTitle icon={Phone}>Contact</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email *" htmlFor="edit-email">
              <Inp
                id="edit-email"
                type="email"
                value={formData.email || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Téléphone *" htmlFor="edit-telephone">
              <Inp
                id="edit-telephone"
                value={formData.telephone || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
                required
              />
            </Field>
            <div className="col-span-2">
              <Field label="Adresse *" htmlFor="edit-adresse">
                <Inp
                  id="edit-adresse"
                  value={formData.adresse || ""}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  required
                />
              </Field>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle icon={Briefcase}>Professionnel</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Poste *" htmlFor="edit-poste">
              <Inp
                id="edit-poste"
                value={formData.poste || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, poste: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Mission" htmlFor="edit-mission">
              <Inp
                id="edit-mission"
                value={formData.mission || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, mission: e.target.value })
                }
              />
            </Field>
            <Field label="Date de début *" htmlFor="edit-dateDebut">
              <Inp
                id="edit-dateDebut"
                type="date"
                value={formData.dateDebut?.split("T")[0] || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({
                    ...formData,
                    dateDebut: e.target.value
                      ? `${e.target.value}T00:00:00.000Z`
                      : "",
                  })
                }
                required
              />
            </Field>
            <Field label="Date de fin" htmlFor="edit-dateFin">
              <Inp
                id="edit-dateFin"
                type="date"
                value={formData.dateFin?.split("T")[0] || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({
                    ...formData,
                    dateFin: e.target.value
                      ? `${e.target.value}T00:00:00.000Z`
                      : null,
                  })
                }
                disabled={formData.dateFinIndeterminee}
              />
            </Field>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-dateFinIndeterminee"
                checked={formData.dateFinIndeterminee || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dateFinIndeterminee: e.target.checked,
                  })
                }
                className="w-3.5 h-3.5 accent-violet-500 cursor-pointer"
              />
              <label
                htmlFor="edit-dateFinIndeterminee"
                className="text-xs text-gray-400 cursor-pointer"
              >
                Date de fin indéterminée
              </label>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle icon={FileText}>Financier</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {agent.profile === "stagiaire" ? (
              <>
                <Field label="Indemnité mensuelle" htmlFor="edit-indemnite">
                  <Inp
                    id="edit-indemnite"
                    type="number"
                    value={formData.indemnite || 0}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({
                        ...formData,
                        indemnite: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field
                  label="Indemnité connexion"
                  htmlFor="edit-indemniteConnexion"
                >
                  <Inp
                    id="edit-indemniteConnexion"
                    type="number"
                    value={formData.indemniteConnexion || 0}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({
                        ...formData,
                        indemniteConnexion: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="TJM *" htmlFor="edit-tjm">
                  <Inp
                    id="edit-tjm"
                    type="number"
                    value={formData.tjm || 0}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({ ...formData, tjm: Number(e.target.value) })
                    }
                    required
                  />
                </Field>
                <Field label="Tarif journalier" htmlFor="edit-tarifJournalier">
                  <Inp
                    id="edit-tarifJournalier"
                    type="number"
                    value={formData.tarifJournalier || 0}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({
                        ...formData,
                        tarifJournalier: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field
                  label="Durée journalière (h)"
                  htmlFor="edit-dureeJournaliere"
                >
                  <Inp
                    id="edit-dureeJournaliere"
                    type="number"
                    value={formData.dureeJournaliere || 0}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({
                        ...formData,
                        dureeJournaliere: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field
                  label="Domaine de prestation"
                  htmlFor="edit-domainePrestation"
                >
                  <Inp
                    id="edit-domainePrestation"
                    value={formData.domainePrestation || ""}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({
                        ...formData,
                        domainePrestation: e.target.value,
                      })
                    }
                  />
                </Field>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#2e3144]">
          <Btn
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Annuler
          </Btn>
          <Btn
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0"
          >
            {isSubmitting ? "Modification…" : "Modifier"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
