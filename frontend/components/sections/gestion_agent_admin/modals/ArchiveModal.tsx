"use client";

import type React from "react";
import { useState } from "react";
import { X } from "lucide-react";
import type { Agent } from "@/lib/users-service";

// Constantes en dur
const MODAL_HEADER_CLASSES = {
  default: "from-violet-600 to-fuchsia-600",
  archive: "from-orange-600 to-orange-600",
  edit: "from-blue-600 to-cyan-600",
  archived: "from-gray-600 to-gray-500"
};

// Composants UI locaux
function Modal({ onClose, header, headerClass = "from-violet-600 to-fuchsia-600", children, maxWidth = "max-w-3xl" }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-[#1a1c26] border border-[#2e3144] rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 bg-gradient-to-r ${headerClass} text-white p-4 rounded-t-2xl flex items-center justify-between`}>
          {header}
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: any) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Inp({ id, value, onChange, placeholder }: any) {
  return (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-8 px-3 text-sm bg-[#13141b] border border-[#3a3d4e] text-white rounded-lg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-gray-600 transition-colors"
    />
  );
}

function Btn({ children, onClick, disabled, className = "", variant = "primary" }: any) {
  const base = "inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-3.5 py-2 text-sm h-9";
  
  const variants: Record<string, string> = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white focus:ring-violet-500",
    outline: "border border-[#3a3d4e] hover:border-violet-500 text-gray-300 hover:text-white bg-transparent focus:ring-violet-500",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
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

interface ArchiveModalProps {
  agent: Agent;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export function ArchiveModal({ agent, onClose, onConfirm, isPending }: ArchiveModalProps) {
  const [archiveReason, setArchiveReason] = useState("");

  const handleConfirm = () => {
    onConfirm(archiveReason);
  };

  return (
    <Modal
      onClose={onClose}
      headerClass={MODAL_HEADER_CLASSES.archive}
      header={
        <div>
          <h2 className="text-sm font-bold">Archiver l'agent</h2>
          <p className="text-xs text-orange-200 mt-0.5">{agent.prenoms} {agent.nom}</p>
        </div>
      }
      maxWidth="max-w-sm"
    >
      <div className="p-3 sm:p-4 space-y-3">
        <Field label="Raison de l'archivage (optionnel)" htmlFor="archiveReason">
          <Inp 
            id="archiveReason" 
            value={archiveReason} 
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setArchiveReason(e.target.value)} 
            placeholder="Ex: Fin de contrat, départ…" 
          />
        </Field>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
          L'agent sera marqué comme archivé. Toutes ses données seront conservées.
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Btn variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
            Annuler
          </Btn>
          <Btn 
            onClick={handleConfirm} 
            disabled={isPending} 
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-600 hover:from-amber-500 hover:to-amber-500 border-0"
          >
            {isPending ? "Archivage…" : "Confirmer"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}