"use client"

import { useState } from "react"
import { X, CheckCircle, XCircle, Calendar, User, AlertTriangle } from "lucide-react"
import type { Absence } from "@/lib/absence-service"

interface ValidateAbsenceModalProps {
  isOpen: boolean
  onClose: () => void
  absence: Absence
  onValidate: (data: { status: string; adminReason: string }) => void
  isLoading: boolean
  actionType: "approve" | "reject" | null
}

export function ValidateAbsenceModal({
  isOpen,
  onClose,
  absence,
  onValidate,
  isLoading,
  actionType,
}: ValidateAbsenceModalProps) {
  const [adminReason, setAdminReason] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!actionType) return
    onValidate({
      status: actionType === "approve" ? "approved" : "rejected",
      adminReason: adminReason.trim(),
    })
  }

  const getAgentName = () => {
    if (typeof absence.agentId === "object" && absence.agentId.nom) {
      return `${absence.agentId.nom} ${absence.agentId.prenoms}`
    }
    return "Agent inconnu"
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 -mt-90">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-[#1F2128] backdrop-blur-xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-[#313442]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                actionType === "approve" ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                {actionType === "approve" ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {actionType === "approve" ? "Approuver la demande" : "Rejeter la demande"}
                </h3>
                <p className="text-sm text-slate-400">
                  {getAgentName()} — {formatDate(absence.startDate)}
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

          {/* Détails de l'absence (Style harmonisé avec le dark theme) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[#0F0F12] rounded-xl border border-[#313442]">
               <div className="flex items-center gap-2 mb-2 text-violet-400">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Agent</span>
               </div>
               <p className="text-white font-medium">{getAgentName()}</p>
               <p className="text-xs text-slate-500">Backup: {absence.backupPerson}</p>
            </div>

            <div className="p-4 bg-[#0F0F12] rounded-xl border border-[#313442]">
               <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Période</span>
               </div>
               <p className="text-white font-medium">Du {formatDate(absence.startDate)}</p>
               <p className="text-white font-medium">Au {formatDate(absence.endDate)}</p>
            </div>

            <div className="md:col-span-2 p-4 bg-[#0F0F12] rounded-xl border border-[#313442]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Raison de l'absence</span>
              <p className="text-sm text-slate-300 italic">"{absence.reason}"</p>
            </div>
          </div>

          {/* Commentaire Admin */}
          <div className="space-y-2 mb-6">
            <label className="text-white text-sm font-medium block">
              {actionType === "approve" ? "Message à l'agent (optionnel)" : "Motif du rejet"}
            </label>
            <textarea
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              placeholder={actionType === "approve" ? "Bonnes vacances !" : "Poste non pourvu durant cette période..."}
              rows={3}
              className="w-full bg-[#0F0F12] border border-transparent focus:border-purple-500 text-white p-3 rounded-xl outline-none transition-colors resize-none placeholder:text-slate-600"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              <strong>Notification automatique :</strong> En validant, un email sera envoyé à l'agent pour l'informer de votre décision. Cette action est irréversible.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex-[2] py-3 rounded-xl font-semibold text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20"
                  : "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {actionType === "approve" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  {actionType === "approve" ? "Confirmer l'approbation" : "Confirmer le rejet"}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-transparent border border-[#313442] text-slate-300 hover:bg-white/5 py-3 rounded-xl font-medium transition-all duration-300"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}