"use client"

import type React from "react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { absenceService, type CreateAbsenceDto } from "@/lib/absence-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreateAbsenceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateAbsenceModal({ isOpen, onClose }: CreateAbsenceModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CreateAbsenceDto>({
    startDate: "",
    endDate: "",
    reason: "",
    backupPerson: "",
  })

  const createMutation = useMutation({
    mutationFn: absenceService.createAbsence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] })
      setFormData({
        startDate: "",
        endDate: "",
        reason: "",
        backupPerson: "",
      })
      onClose()
    },
    onError: (error: any) => {
      console.error("Erreur création absence:", error)
      alert(error.response?.data?.message || "Erreur lors de la création de la demande d'absence")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des dates
    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      alert("La date de début ne peut pas être dans le passé")
      return
    }

    if (startDate >= endDate) {
      alert("La date de fin doit être après la date de début")
      return
    }

    createMutation.mutate(formData)
  }

  const handleClose = () => {
    setFormData({
      startDate: "",
      endDate: "",
      reason: "",
      backupPerson: "",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent text-lg">
            Nouvelle demande d'absence
          </DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour créer une nouvelle demande d'absence.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason" className="text-purple-700 font-medium">
              Raison de l'absence *
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Congé annuel, Maladie, Formation..."
              className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all min-h-[80px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-purple-700 font-medium">
                Date de début *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all"
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-purple-700 font-medium">
                Date de fin *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="backupPerson" className="text-purple-700 font-medium">
              Personne de backup *
            </Label>
            <Input
              id="backupPerson"
              value={formData.backupPerson}
              onChange={(e) => setFormData({ ...formData, backupPerson: e.target.value })}
              placeholder="Nom de la personne qui vous remplacera"
              className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 transition-all"
              required
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-2">Informations importantes</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Les demandes doivent être soumises à l'avance</li>
              <li>• Seules les demandes en attente peuvent être supprimées</li>
              <li>• Vous serez notifié par email du statut de votre demande</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 bg-transparent transition-all duration-200"
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !formData.startDate || !formData.endDate || !formData.reason || !formData.backupPerson}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {createMutation.isPending ? "Création en cours..." : "Soumettre la demande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}