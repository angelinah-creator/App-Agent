"use client"

import type React from "react"

import { X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CreateKPIDto } from "@/lib/types"

interface UploadKPIModalProps {
  isOpen: boolean
  onClose: () => void
  uploadData: CreateKPIDto
  onUploadDataChange: (data: CreateKPIDto) => void
  selectedFile: File | null
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
  isLoading: boolean
}

export function UploadKPIModal({
  isOpen,
  onClose,
  uploadData,
  onUploadDataChange,
  selectedFile,
  onFileSelect,
  onUpload,
  isLoading,
}: UploadKPIModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md border-slate-200/50 animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-white/95 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-800">Ajouter un rapport mensuel</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Type de rapport - DÉSACTIVÉ et fixé à "Rapport Mensuel" */}
            <div>
              <Label htmlFor="kpiType" className="text-slate-700 font-medium">
                Type de rapport
              </Label>
              <div className="mt-1.5 px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-700">
                Rapport Mensuel
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tous les rapports sont mensuels
              </p>
            </div>

            <div>
              <Label htmlFor="periode" className="text-slate-700 font-medium">
                Période *
              </Label>
              <Input
                type="month"
                value={uploadData.periode}
                onChange={(e) => onUploadDataChange({ ...uploadData, periode: e.target.value })}
                className="mt-1.5 border-slate-300 focus:border-violet-500 focus:ring-violet-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700 font-medium">
                Description (optionnel)
              </Label>
              <Input
                value={uploadData.description}
                onChange={(e) => onUploadDataChange({ ...uploadData, description: e.target.value })}
                placeholder="Description du rapport"
                className="mt-1.5 border-slate-300 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            <div>
              <Label htmlFor="file" className="text-slate-700 font-medium">
                Fichier *
              </Label>
              <div
                className="mt-1.5 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50/50 transition-all duration-300 hover:scale-102"
                onClick={() => document.getElementById("kpi-file-upload")?.click()}
              >
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  {selectedFile ? selectedFile.name : "Cliquez pour sélectionner un fichier"}
                </p>
                <p className="text-xs text-slate-500 mt-2">PDF, DOC, DOCX, XLS, XLSX (max 10MB)</p>
                <input
                  type="file"
                  onChange={onFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  id="kpi-file-upload"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={onUpload}
                disabled={isLoading || !selectedFile || !uploadData.periode}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Upload...
                  </>
                ) : (
                  "Uploader"
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}