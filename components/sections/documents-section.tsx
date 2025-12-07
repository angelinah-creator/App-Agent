"use client"

import { FileText, Upload, Eye, Download, Trash2, Plus, BarChart3, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Document } from "@/lib/document-service"
import type { Contract } from "@/lib/contract-service"
import type { Nda } from "@/lib/nda-service"

interface DocumentsSectionProps {
  contracts: Contract[]
  ndas: Nda[]
  documents: Document[]
  contractsLoading: boolean
  ndasLoading: boolean
  documentsLoading: boolean
  onGenerateContract: () => void
  onGenerateNda: () => void
  onAddDocument: () => void
  onViewDocument: (url: string) => void
  onDownloadDocument: (doc: Document) => void
  onDownloadContract: (contract: Contract) => void
  onDownloadNda: (nda: Nda) => void
  onDeleteDocument: (id: string) => void
  onDeleteContract: (id: string) => void
  onDeleteNda: (id: string) => void
  generateContractPending: boolean
  generateNdaPending: boolean
  deleteDocumentPending: boolean
  deleteContractPending: boolean
  deleteNdaPending: boolean
}

export function DocumentsSection({
  contracts,
  ndas,
  documents,
  contractsLoading,
  ndasLoading,
  documentsLoading,
  onGenerateContract,
  onGenerateNda,
  onAddDocument,
  onViewDocument,
  onDownloadDocument,
  onDownloadContract,
  onDownloadNda,
  onDeleteDocument,
  onDeleteContract,
  onDeleteNda,
  generateContractPending,
  generateNdaPending,
  deleteDocumentPending,
  deleteContractPending,
  deleteNdaPending,
}: DocumentsSectionProps) {
  const getDocumentTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      cin_recto: "CIN Recto",
      cin_verso: "CIN Verso",
      certificat_residence: "Certificat de Résidence",
      diplome: "Diplôme",
      cv: "CV",
      autre: "Autre",
    }
    return typeLabels[type] || type
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Contrats et NDA - En mode compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contrats Section */}
        <Card className="border-slate-200/50 hover:shadow-md hover:shadow-slate-200/30 transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Contrats</h3>
              </div>
              <Button
                onClick={onGenerateContract}
                disabled={generateContractPending}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
              >
                <Plus className="w-3 h-3 mr-1" />
                {generateContractPending ? "..." : "Générer"}
              </Button>
            </div>

            {contractsLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="text-xs text-slate-600 mt-2 font-medium">Chargement...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-6 bg-gradient-to-br from-slate-50 to-blue-50/20 rounded-lg">
                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-xs text-slate-600 font-medium">Aucun contrat</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {contracts.map((contract: Contract) => (
                  <div
                    key={contract._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50/50 transition-all duration-200 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{contract.fileName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {new Date(contract.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDownloadContract(contract)}
                        disabled={deleteContractPending}
                        className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteContract(contract._id)}
                        disabled={deleteContractPending}
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NDA Section */}
        <Card className="border-slate-200/50 hover:shadow-md hover:shadow-slate-200/30 transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">NDA</h3>
              </div>
              <Button
                onClick={onGenerateNda}
                disabled={generateNdaPending}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
              >
                <Plus className="w-3 h-3 mr-1" />
                {generateNdaPending ? "..." : "Générer"}
              </Button>
            </div>

            {ndasLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-200 border-t-purple-600 mx-auto"></div>
                <p className="text-xs text-slate-600 mt-2 font-medium">Chargement...</p>
              </div>
            ) : ndas.length === 0 ? (
              <div className="text-center py-6 bg-gradient-to-br from-slate-50 to-purple-50/20 rounded-lg">
                <Shield className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-xs text-slate-600 font-medium">Aucun NDA</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {ndas.map((nda: Nda) => (
                  <div
                    key={nda._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50/50 transition-all duration-200 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{nda.fileName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {new Date(nda.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDownloadNda(nda)}
                        disabled={deleteNdaPending}
                        className="h-7 w-7 text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteNda(nda._id)}
                        disabled={deleteNdaPending}
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section - Plus compacte */}
      <Card className="border-slate-200/50 hover:shadow-md hover:shadow-slate-200/30 transition-all duration-300 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Documents</h3>
            </div>
            <Button
              onClick={onAddDocument}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>

          {documentsLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
              <p className="text-xs text-slate-600 mt-2 font-medium">Chargement...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-6 bg-gradient-to-br from-slate-50 to-blue-50/20 rounded-lg">
              <Upload className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-xs text-slate-600 font-medium">Aucun document</p>
              <p className="text-xs text-slate-500 mt-1">Ajoutez vos premiers documents</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {documents.map((doc: Document) => (
                <Card
                  key={doc._id}
                  className="border-slate-100 hover:shadow-md hover:shadow-slate-200/30 transition-all duration-200 bg-white/60 backdrop-blur-sm"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-800 truncate">{doc.originalName}</h4>
                        <p className="text-xs text-slate-500 truncate">
                          {getDocumentTypeLabel(doc.type)} • {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDownloadDocument(doc)}
                        disabled={deleteDocumentPending}
                        className="flex-1 text-xs h-7 text-slate-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteDocument(doc._id)}
                        disabled={deleteDocumentPending}
                        className="h-7 w-7 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards - Plus compactes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-slate-200/50 hover:shadow-md hover:shadow-indigo-200/30 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Documents</p>
                <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {documents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}