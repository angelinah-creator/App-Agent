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
import type { CreateAgentDto, Genre, UserProfile } from "@/lib/users-service";
import { usersService } from "@/lib/users-service";
import type { FormDataType } from "../types";

// Constantes en dur
const MODAL_HEADER_CLASSES = {
  default: "from-violet-600 to-fuchsia-600",
  archive: "from-orange-600 to-amber-600",
  edit: "from-blue-600 to-cyan-600",
  archived: "from-gray-600 to-gray-500",
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

function Sel({ id, value, onChange, children }: any) {
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

interface AddAgentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAgentModal({ onClose, onSuccess }: AddAgentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    profile: "stagiaire" as UserProfile,
    nom: "",
    prenoms: "",
    dateNaissance: "",
    genre: "Homme" as Genre,
    adresse: "",
    cin: "",
    poste: "",
    dateDebut: "",
    dateFinIndeterminee: false,
    tjm: 0,
    telephone: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await usersService.createAgent(formData);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de l'agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      header={<h2 className="text-sm font-bold">Ajouter un agent</h2>}
    >
      <form onSubmit={handleSubmit} className="p-3 sm:p-5 space-y-5">
        {/* Base */}
        <div>
          <SectionTitle icon={Users}>Informations de base</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Profil *" htmlFor="profile">
              <Sel
                id="profile"
                value={formData.profile}
                onChange={(v: UserProfile) =>
                  setFormData({ ...formData, profile: v as UserProfile })
                }
              >
                <option value="stagiaire">Stagiaire</option>
                <option value="prestataire">Prestataire</option>
                <option value="admin">Admin</option>
              </Sel>
            </Field>
            <Field label="Nom *" htmlFor="nom">
              <Inp
                id="nom"
                value={formData.nom}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Prénoms *" htmlFor="prenoms">
              <Inp
                id="prenoms"
                value={formData.prenoms}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, prenoms: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Genre *" htmlFor="genre">
              <Sel
                id="genre"
                value={formData.genre}
                onChange={(v: Genre) =>
                  setFormData({ ...formData, genre: v as Genre })
                }
              >
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </Sel>
            </Field>
            <Field label="Date de naissance *" htmlFor="dateNaissance">
              <Inp
                id="dateNaissance"
                type="date"
                value={formData.dateNaissance}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, dateNaissance: e.target.value })
                }
                required
              />
            </Field>
            <Field label="CIN *" htmlFor="cin">
              <Inp
                id="cin"
                value={formData.cin}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, cin: e.target.value })
                }
                required
              />
            </Field>
          </div>
        </div>

        {/* Contact */}
        <div>
          <SectionTitle icon={Phone}>Contact</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email *" htmlFor="email">
              <Inp
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Téléphone *" htmlFor="telephone">
              <Inp
                id="telephone"
                value={formData.telephone}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Adresse *" htmlFor="adresse">
                <Inp
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  required
                />
              </Field>
            </div>
            <Field label="Mot de passe *" htmlFor="password">
              <Inp
                id="password"
                type="password"
                value={formData.password}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </Field>
          </div>
        </div>

        {/* Pro */}
        <div>
          <SectionTitle icon={Briefcase}>Professionnel</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Poste *" htmlFor="poste">
              <Inp
                id="poste"
                value={formData.poste}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, poste: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Mission" htmlFor="mission">
              <Inp
                id="mission"
                value={formData.mission || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, mission: e.target.value })
                }
              />
            </Field>
            <Field label="Date de début *" htmlFor="dateDebut">
              <Inp
                id="dateDebut"
                type="date"
                value={formData.dateDebut}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, dateDebut: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Date de fin" htmlFor="dateFin">
              <Inp
                id="dateFin"
                type="date"
                value={formData.dateFin || ""}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, dateFin: e.target.value })
                }
                disabled={formData.dateFinIndeterminee}
              />
            </Field>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="dateFinIndeterminee"
                checked={formData.dateFinIndeterminee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dateFinIndeterminee: e.target.checked,
                  })
                }
                className="w-3.5 h-3.5 accent-violet-500 cursor-pointer"
              />
              <label
                htmlFor="dateFinIndeterminee"
                className="text-xs text-gray-400 cursor-pointer"
              >
                Date de fin indéterminée
              </label>
            </div>
          </div>
        </div>

        {/* Finance */}
        <div>
          <SectionTitle icon={FileText}>Financier</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.profile === "stagiaire" ? (
              <>
                <Field label="Indemnité mensuelle" htmlFor="indemnite">
                  <Inp
                    id="indemnite"
                    type="number"
                    value={formData.indemnite || ""}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({
                        ...formData,
                        indemnite: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Indemnité connexion" htmlFor="indemniteConnexion">
                  <Inp
                    id="indemniteConnexion"
                    type="number"
                    value={formData.indemniteConnexion || ""}
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
                <Field label="TJM *" htmlFor="tjm">
                  <Inp
                    id="tjm"
                    type="number"
                    value={formData.tjm}
                    onChange={(e: { target: { value: any } }) =>
                      setFormData({ ...formData, tjm: Number(e.target.value) })
                    }
                    required
                  />
                </Field>
                <Field label="Durée journalière (h)" htmlFor="dureeJournaliere">
                  <Inp
                    id="dureeJournaliere"
                    type="number"
                    value={formData.dureeJournaliere || ""}
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
                  htmlFor="domainePrestation"
                >
                  <Inp
                    id="domainePrestation"
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

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#2e3144]">
          <Btn
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Annuler
          </Btn>
          <Btn type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Création…" : "Créer l'agent"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
