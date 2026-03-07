"use client";

import type React from "react";

import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { input } from "@/components/ui/input"
// import { div } from "@/components/ui/div"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateDocumentDto } from "@/lib/types";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadData: CreateDocumentDto;
  onUploadDataChange: (data: CreateDocumentDto) => void;
  selectedFile: File | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isLoading: boolean;
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  uploadData,
  onUploadDataChange,
  selectedFile,
  onFileSelect,
  onUpload,
  isLoading,
}: UploadDocumentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 shadow-2xl bg-[#1F2128] backdrop-blur-xl rounded-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Ajouter un document
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-white font-medium">
                Description (optionnel)
              </div>
              <textarea
                value={uploadData.description}
                onChange={(e) =>
                  onUploadDataChange({
                    ...uploadData,
                    description: e.target.value,
                  })
                }
                placeholder="Description du document..."
                rows={2}
                className="mt-1.5 bg-[#0F0F12] focus:border-purple-500 text-white w-full p-2 rounded-lg resize-y min-h-[100px] outline-none transition-colors"
              />
            </div>

            <div>
              <div className="text-white font-medium">Fichier</div>
              <div
                className="mt-1.5 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-all duration-300 hover:scale-102"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-white">
                  {selectedFile
                    ? selectedFile.name
                    : "Cliquez pour sélectionner un fichier"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  PDF, DOC, DOCX, JPG, PNG (max 10MB)
                </p>
                <input
                  type="file"
                  onChange={onFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  id="file-upload"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={onUpload}
                disabled={isLoading || !selectedFile}
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
  );
}
