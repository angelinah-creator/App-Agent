// frontend/components/dialogs/add-facture-dialog.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddFactureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { month: number; year: number; reference: string; file: File | null }) => void
  isSubmitting?: boolean
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
]

export function AddFactureDialog({ open, onOpenChange, onSubmit, isSubmitting }: AddFactureDialogProps) {
  const [month, setMonth] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [reference, setReference] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  useEffect(() => {
    if (open) {
      setYear(currentYear.toString())
      setMonth((new Date().getMonth() + 1).toString())
    }
  }, [open, currentYear])

  const handleFileChange = (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Veuillez sélectionner un fichier PDF")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 10MB)")
      return
    }
    setFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!month || !year || !reference || !file) {
      alert("Veuillez remplir tous les champs")
      return
    }

    onSubmit({ month: parseInt(month), year: parseInt(year), reference, file })
  }

  const handleClose = () => {
    setMonth("")
    setYear("")
    setReference("")
    setFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 rounded-xl overflow-hidden">
        
        {/* Contenu scrollable */}
        <div className="max-h-[90vh] overflow-y-auto px-6 py-5 space-y-6">

          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Ajouter une facture</DialogTitle>
            <DialogDescription>
              Envoyez votre facture PDF. Les autres informations seront gérées par l’administrateur.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Mois */}
            <div className="space-y-2">
              <Label>Mois <span className="text-red-500">*</span></Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sélectionnez un mois" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Année */}
            <div className="space-y-2">
              <Label>Année <span className="text-red-500">*</span></Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sélectionnez une année" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Référence */}
            <div className="space-y-2">
              <Label>Référence de la facture <span className="text-red-500">*</span></Label>
              <Input
                className="h-11"
                placeholder="Ex: FAC-2024-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Upload amélioré */}
            <div className="space-y-2">
              <Label>Facture (PDF) <span className="text-red-500">*</span></Label>

              {/* Zone drag-and-drop + clic */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("fileUploadInput")?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
                  ${dragging ? "border-purple-600 bg-purple-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}
                `}
              >
                <Upload className="mx-auto mb-3 w-8 h-8 text-slate-500" />
                <p className="text-sm text-slate-600">
                  Cliquez ou glissez votre fichier PDF ici
                </p>
                <p className="text-xs text-slate-500 mt-1">Taille max : 10MB</p>

                <input
                  id="fileUploadInput"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                />
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 bg-slate-100 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Champs non modifiables */}
            <div className="space-y-2">
              <Label>Montant</Label>
              <div className="px-3 py-2 bg-slate-50 border rounded-md text-slate-400 text-sm">
                À compléter par l'administrateur
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <div className="px-3 py-2 bg-slate-50 border rounded-md text-slate-400 text-sm">
                À compléter par l'administrateur
              </div>
            </div>

            <div className="space-y-2 pb-3">
              <Label>Statut</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-md">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-sm text-slate-700">En attente de validation</span>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !month || !year || !reference || !file}
                className="h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isSubmitting ? "Ajout en cours..." : "Ajouter la facture"}
              </Button>
            </DialogFooter>

          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
