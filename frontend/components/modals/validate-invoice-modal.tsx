"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Calendar, FileText, DollarSign, AlertTriangle, ChevronDown } from "lucide-react";
import type { Invoice } from "@/lib/types";

interface ValidateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onValidate: (data: {
    paymentDate: string;
    transferReference: string;
    status: string;
  }) => void;
  isLoading: boolean;
}

export function ValidateInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onValidate,
  isLoading,
}: ValidateInvoiceModalProps) {
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [transferReference, setTransferReference] = useState<string>("");
  const [status, setStatus] = useState<string>("paid");

  useEffect(() => {
    if (isOpen) {
      setPaymentDate(
        invoice.paymentDate
          ? new Date(invoice.paymentDate).toISOString().split("T")[0]
          : ""
      );
      setTransferReference(invoice.transferReference || "");
      setStatus(invoice.status || "paid");
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDate || !transferReference) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    onValidate({ paymentDate, transferReference, status });
  };

  const getMonthName = (month: number) => {
    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return months[month - 1] || "Mois inconnu";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 pt-10">
      <div className="w-full max-w-2xl h-screen animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-[#1F2128] backdrop-blur-xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-[#313442]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Valider la facture
                </h3>
                <p className="text-sm text-slate-400">
                  Complétez les informations de paiement
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Détails de la facture (style harmonisé) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Carte Référence & Période */}
            <div className="p-4 bg-[#0F0F12] rounded-xl border border-[#313442]">
              <div className="flex items-center gap-2 mb-2 text-violet-400">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Référence & Période
                </span>
              </div>
              <p className="text-white font-medium">{invoice.reference}</p>
              <p className="text-sm text-slate-400">
                {getMonthName(invoice.month)} {invoice.year}
              </p>
            </div>

            {/* Carte Montant & Statut actuel */}
            <div className="p-4 bg-[#0F0F12] rounded-xl border border-[#313442]">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Montant & Statut
                </span>
              </div>
              <p className="text-white font-medium">
                {invoice.amount
                  ? invoice.amount.toLocaleString("fr-FR") + " Ar"
                  : "Non défini"}
              </p>
              <p className="text-sm text-slate-400">
                Statut actuel :{" "}
                {invoice.status === "pending"
                  ? "En attente"
                  : invoice.status === "paid"
                  ? "Payée"
                  : "Non payée"}
              </p>
            </div>
          </div>

          {/* Formulaire de validation */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date de paiement */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">
                Date de paiement <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors [color-scheme:dark]"
              />
              <p className="text-xs text-slate-500">
                Date à laquelle le paiement a été effectué
              </p>
            </div>

            {/* Référence de virement */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">
                Référence de virement <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="VIR-2025-001234"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                required
                className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors placeholder:text-slate-600"
              />
              <p className="text-xs text-slate-500">
                Numéro de référence du virement bancaire
              </p>
            </div>

            {/* Statut (select natif stylisé) */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">
                Statut <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors appearance-none"
                >
                  <option value="paid" className="bg-[#1F2128] text-white">
                    Payée
                  </option>
                  <option value="unpaid" className="bg-[#1F2128] text-white">
                    Non payée
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-500">
                Statut de paiement de la facture
              </p>
            </div>

            {/* Avertissement */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                <strong>Notification automatique :</strong> L'agent sera
                automatiquement notifié de cette validation par email et
                notification.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading || !paymentDate || !transferReference}
                className="flex-[2] py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-900/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Valider la facture
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-transparent border border-[#313442] text-slate-300 hover:bg-white/5 py-3 rounded-xl font-medium transition-all duration-300"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 