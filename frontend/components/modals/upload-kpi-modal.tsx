"use client"

import type React from "react"

import { X, Upload, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-[#1F2128] backdrop-blur-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white">Ajouter un rapport mensuel</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-white font-medium">
                Période *
              </div>
              <div className="relative">
                <input
                  type="month"
                  value={uploadData.periode}
                  onChange={(e) => onUploadDataChange({ ...uploadData, periode: e.target.value })}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker()
                    } catch (err) {
                      console.log("Picker not supported or needs user gesture", err)
                    }
                  }}
                  className="mt-1.5 bg-[#0F0F12] focus:border-purple-500 text-white w-full p-2 pr-10 rounded-lg outline-none transition-colors white-calendar-icon cursor-pointer"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none mt-1" />
              </div>
            </div>

            <div>
              <div className="text-white font-medium">
                Description (optionnel)
              </div>
              <textarea
                value={uploadData.description}
                onChange={(e) => onUploadDataChange({ ...uploadData, description: e.target.value })}
                placeholder="Description du rapport"
                className="mt-1.5 bg-[#0F0F12] focus:border-purple-500 text-white w-full p-2 rounded-lg resize-y min-h-[80px] outline-none transition-colors"
              />
            </div>

            <div>
              <div className="text-white font-medium">
                Fichier *
              </div>
              <div
                className="mt-1.5 border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500 transition-all duration-300"
                onClick={() => document.getElementById("kpi-file-upload")?.click()}
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-white">
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

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={onUpload}
                disabled={isLoading || !selectedFile || !uploadData.periode}
                className="flex-1 bg-blue-600 hover:bg-slate-50 text-white hover:text-blue-600 transition-all duration-300 hover:scale-105"
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
                className="flex-1 text-white hover:text-slate-700 border-slate-300 hover:bg-slate-50 transition-all duration-200 bg-transparent hover:scale-105"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}