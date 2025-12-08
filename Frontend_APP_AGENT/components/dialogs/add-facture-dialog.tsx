// frontend/components/dialogs/add-facture-dialog.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
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

  // Générer les 5 dernières années
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  useEffect(() => {
    if (open) {
      // Définir l'année courante par défaut
      setYear(currentYear.toString())
      // Définir le mois courant par défaut
      const currentMonth = (new Date().getMonth() + 1).toString()
      setMonth(currentMonth)
    }
  }, [open, currentYear])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Vérifier que c'est un PDF
      if (selectedFile.type !== 'application/pdf') {
        alert('Veuillez sélectionner un fichier PDF')
        return
      }
      
      // Vérifier la taille (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum: 10MB')
        return
      }
      
      setFile(selectedFile)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!month || !year || !reference || !file) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    // CORRECTION: Passer toutes les données au parent
    onSubmit({ 
      month: parseInt(month), 
      year: parseInt(year), 
      reference, 
      file 
    })
    
    // Reset form
    setMonth("")
    setYear("")
    setReference("")
    setFile(null)
  }

  const handleClose = () => {
    setMonth("")
    setYear("")
    setReference("")
    setFile(null)
    onOpenChange(false)
  }

  const getMonthName = (monthValue: string) => {
    const month = MONTHS.find(m => m.value === monthValue)
    return month ? month.label : ''
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une facture</DialogTitle>
          <DialogDescription>
            Remplissez les informations de la facture. Le montant et la date de paiement seront complétés par l'administrateur.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Mois */}
            <div className="space-y-2">
              <Label htmlFor="month">Mois <span className="text-red-500">*</span></Label>
              <Select value={month} onValueChange={setMonth} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un mois" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((monthOption) => (
                    <SelectItem key={monthOption.value} value={monthOption.value}>
                      {monthOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Année */}
            <div className="space-y-2">
              <Label htmlFor="year">Année <span className="text-red-500">*</span></Label>
              <Select value={year} onValueChange={setYear} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une année" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yearOption) => (
                    <SelectItem key={yearOption} value={yearOption}>
                      {yearOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Référence */}
            <div className="space-y-2">
              <Label htmlFor="reference">Référence de la facture <span className="text-red-500">*</span></Label>
              <Input
                id="reference"
                placeholder="Ex: FAC-2024-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
            </div>

            {/* Fichier PDF */}
            <div className="space-y-2">
              <Label htmlFor="facture">Facture (PDF) <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-2">
                <Input
                  id="facture"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  required
                />
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {file && (
                <div className="text-sm text-slate-600">
                  <p>Fichier sélectionné: {file.name}</p>
                  <p className="text-slate-500">Taille: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Formats acceptés: PDF uniquement. Taille maximum: 10MB
              </p>
            </div>

            {/* Informations non modifiables par l'agent */}
            <div className="space-y-2">
              <Label>Période de la facture</Label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-sm">
                {month && year ? `${getMonthName(month)} ${year}` : "---"}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Montant</Label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-400 text-sm">
                À compléter par l'administrateur
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-400 text-sm">
                À compléter par l'administrateur
              </div>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-sm text-slate-600">En attente de validation</span>
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !month || !year || !reference || !file}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {isSubmitting ? "Ajout en cours..." : "Ajouter la facture"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}