"use client"

import { useState } from "react"
import { X, CheckCircle, XCircle, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Absence } from "@/lib/absence-service"

interface ValidateAbsenceModalProps {
  isOpen: boolean
  onClose: () => void
  absence: Absence
  onValidate: (data: { status: string; adminReason: string }) => void
  isLoading: boolean
  actionType: "approve" | "reject" | null // Nouveau prop pour spécifier l'action
}

export function ValidateAbsenceModal({
  isOpen,
  onClose,
  absence,
  onValidate,
  isLoading,
  actionType, // Nouveau prop
}: ValidateAbsenceModalProps) {
  const [adminReason, setAdminReason] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!actionType) return

    if (actionType === "reject" && !adminReason.trim()) {
      alert("Veuillez fournir une raison pour le rejet")
      return
    }

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

  const getAgentEmail = () => {
    if (typeof absence.agentId === "object" && absence.agentId.email) {
      return absence.agentId.email
    }
    return ""
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const calculateDuration = () => {
    const start = new Date(absence.startDate)
    const end = new Date(absence.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return `${diffDays} jour${diffDays > 1 ? "s" : ""}`
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl border-slate-200/50 animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                actionType === "approve" 
                  ? "bg-gradient-to-br from-green-100 to-emerald-100" 
                  : "bg-gradient-to-br from-red-100 to-rose-100"
              }`}>
                {actionType === "approve" ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {actionType === "approve" ? "Approuver la demande" : "Rejeter la demande"}
                </h3>
                <p className="text-sm text-slate-600">
                  {actionType === "approve" 
                    ? "Confirmez l'approbation de cette demande d'absence" 
                    : "Indiquez la raison du rejet de cette demande"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Informations de l'absence */}
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations de l'agent
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Nom:</span>
                  <p className="font-medium text-slate-800">{getAgentName()}</p>
                </div>
                <div>
                  <span className="text-slate-600">Email:</span>
                  <p className="font-medium text-slate-800">{getAgentEmail()}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Détails de l'absence
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Date de début:</span>
                  <p className="font-medium text-slate-800">{formatDate(absence.startDate)}</p>
                </div>
                <div>
                  <span className="text-slate-600">Date de fin:</span>
                  <p className="font-medium text-slate-800">{formatDate(absence.endDate)}</p>
                </div>
                <div>
                  <span className="text-slate-600">Durée:</span>
                  <p className="font-medium text-slate-800">{calculateDuration()}</p>
                </div>
                <div>
                  <span className="text-slate-600">Personne de backup:</span>
                  <p className="font-medium text-slate-800">{absence.backupPerson}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-600">Raison:</span>
                  <p className="mt-1 font-medium text-slate-800 p-3 bg-white rounded-lg border border-slate-200">
                    {absence.reason}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Commentaire admin */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="adminReason" className="text-slate-700 font-medium">
              {actionType === "approve" ? "Message (optionnel)" : "Raison du rejet (optionnel)"}
            </Label>
            <Textarea
              id="adminReason"
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              placeholder={
                actionType === "approve"
                  ? "Ajoutez un message optionnel pour l'agent..."
                  : "Expliquez la raison du rejet (optionnel)..."
              }
              className="min-h-[100px] transition-all duration-300 focus:scale-[1.01] border-slate-300 focus:border-purple-500 focus:ring-purple-500 bg-white"
            />
            <p className="text-xs text-slate-500">
              {actionType === "approve" 
                ? "Le message est optionnel pour une approbation"
                : "La raison du rejet est optionnelle"
              }
            </p>
          </div>

          {/* Avertissement */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <p className="text-sm text-amber-800">
              ⚠️ <strong>Important:</strong> L'agent sera automatiquement notifié de votre décision par email et notification.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex-1 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                actionType === "approve"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/30"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {actionType === "approve" ? "Approbation..." : "Rejet..."}
                </>
              ) : (
                <>
                  {actionType === "approve" ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {actionType === "approve" ? "Approuver" : "Rejeter"}
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 transition-all duration-200 bg-transparent"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}