"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { X, Upload, FileText, AlertTriangle, Clock } from "lucide-react";

interface AddFactureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    month: number;
    year: number;
    reference: string;
    amount: number;
    file: File | null;
  }) => void;
  isSubmitting?: boolean;
}

const MONTHS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export function AddFactureDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AddFactureDialogProps) {
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    if (open) {
      setYear(currentYear.toString());
      const currentMonth = (new Date().getMonth() + 1).toString();
      setMonth(currentMonth);
      setAmount("");
      setReference("");
      setFile(null);
    }
  }, [open, currentYear]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        alert("Veuillez sélectionner un fichier PDF");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. Taille maximum: 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !year || !reference || !amount || !file) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Le montant doit être un nombre positif");
      return;
    }
    onSubmit({
      month: parseInt(month),
      year: parseInt(year),
      reference,
      amount: amountNum,
      file,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden min-h-screen">
      {/* Backdrop - Fond sombre flouté qui couvre TOUTE l'interface */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity cursor-default" 
        onClick={handleClose}
      />

      {/* Fenêtre du Modal */}
      <div className="relative w-full max-w-xl bg-[#1F2128] border border-[#313442] rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Fixe en haut */}
        <div className="p-6 border-b border-[#313442]/50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-white">Ajouter une facture</h3>
            <p className="text-sm text-slate-400 mt-1">Renseignez les détails de la facture</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          <form id="facture-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Grille Période */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-white text-sm font-medium">Mois <span className="text-red-500">*</span></label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                >
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-white text-sm font-medium">Année <span className="text-red-500">*</span></label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Référence & Montant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-white text-sm font-medium">Référence <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="FAC-2024-001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors placeholder:text-slate-600"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-white text-sm font-medium">Montant (Ar) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Facture (PDF) <span className="text-red-500">*</span></label>
              {!file ? (
                <div 
                  className="border-2 border-dashed border-[#313442] bg-[#0F0F12] rounded-xl p-8 text-center cursor-pointer hover:border-violet-500 transition-all group"
                  onClick={() => document.getElementById("pdf-upload")?.click()}
                >
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3 group-hover:text-violet-400 transition-colors" />
                  <p className="text-sm text-white font-medium">Cliquez pour joindre le PDF</p>
                  <p className="text-xs text-slate-500 mt-1">Maximum 10MB</p>
                  <input type="file" id="pdf-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                </div>
              ) : (
                <div className="p-4 bg-[#0F0F12] border border-violet-500/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-violet-500/10 rounded-lg shrink-0"><FileText className="w-6 h-6 text-violet-400" /></div>
                    <div className="truncate"><p className="text-sm text-white truncate">{file.name}</p><p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p></div>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
                </div>
              )}
            </div>

            {/* Info Admin Box */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/80 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p>La date de paiement et la référence de virement seront saisies par l'administrateur lors de la validation.</p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 p-3 bg-[#0F0F12]/50 border border-[#313442] rounded-xl">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Statut : En attente de validation</span>
            </div>
          </form>
        </div>

        {/* Footer - Fixe en bas */}
        <div className="p-6 border-t border-[#313442]/50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-[#313442] text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="facture-form"
            disabled={isSubmitting || !file || !reference || !amount}
            className="flex-[2] bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:pointer-events-none text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-violet-900/20"
          >
            {isSubmitting ? "Envoi en cours..." : "Ajouter la facture"}
          </button>
        </div>
      </div>
    </div>
  );
}