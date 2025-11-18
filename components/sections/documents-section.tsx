"use client"

import { FileText, Upload, Eye, Download, Trash2, Plus, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Document } from "@/lib/document-service"
import type { Contract } from "@/lib/contract-service"

interface DocumentsSectionProps {
  contracts: Contract[]
  documents: Document[]
  contractsLoading: boolean
  documentsLoading: boolean
  onGenerateContract: () => void
  onAddDocument: () => void
  onViewDocument: (url: string) => void
  onDownloadDocument: (doc: Document) => void
  onDownloadContract: (contract: Contract) => void
  onDeleteDocument: (id: string) => void
  onDeleteContract: (id: string) => void
  generateContractPending: boolean
  deleteDocumentPending: boolean
  deleteContractPending: boolean
}

export function DocumentsSection({
  contracts,
  documents,
  contractsLoading,
  documentsLoading,
  onGenerateContract,
  onAddDocument,
  onViewDocument,
  onDownloadDocument,
  onDownloadContract,
  onDeleteDocument,
  onDeleteContract,
  generateContractPending,
  deleteDocumentPending,
  deleteContractPending,
}: DocumentsSectionProps) {
  const calculateTotalSize = (docs: Document[]): number => {
    return docs.reduce((acc: number, doc: Document) => acc + doc.fileSize, 0) / (1024 * 1024)
  }

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Contrats Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Mon Contrat</h3>
          <Button
            onClick={onGenerateContract}
            disabled={generateContractPending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            {generateContractPending ? "Génération..." : "Générer un Contrat"}
          </Button>
        </div>

        {contractsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-3 font-medium">Chargement des contrats...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl">
            <FileText className="mx-auto h-14 w-14 text-slate-400" />
            <p className="mt-4 text-slate-600 font-medium">Aucun contrat généré</p>
            <p className="text-sm text-slate-500 mt-1">
              Cliquez sur "Générer un Contrat" pour créer votre premier contrat
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/50">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Nom du fichier</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Type</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Date de création</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract: Contract) => (
                  <tr
                    key={contract._id}
                    className="border-b border-slate-100 hover:bg-blue-50/50 transition-all duration-200"
                  >
                    <td className="py-4 px-4 text-slate-800 font-medium">{contract.fileName}</td>
                    <td className="py-4 px-4 text-slate-600 capitalize">{contract.type}</td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(contract.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDownloadContract(contract)}
                          disabled={deleteContractPending}
                          className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteContract(contract._id)}
                          disabled={deleteContractPending}
                          className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Mes Documents</h3>
          <Button
            onClick={onAddDocument}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </div>

        {documentsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-3 font-medium">Chargement des documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl">
            <Upload className="mx-auto h-14 w-14 text-slate-400" />
            <p className="mt-4 text-slate-600 font-medium">Aucun document uploadé</p>
            <p className="text-sm text-slate-500 mt-1">
              Cliquez sur "Ajouter un document" pour uploader vos premiers documents
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: Document) => (
              <Card
                key={doc._id}
                className="border-slate-200/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{doc.originalName}</h4>
                      <p className="text-sm text-slate-500">
                        {getDocumentTypeLabel(doc.type)} • {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {doc.description && <p className="text-xs text-slate-500 mt-1 truncate">{doc.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    {/* <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDocument(doc.fileUrl)}
                      className="flex-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button> */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadDocument(doc)}
                      disabled={deleteDocumentPending}
                      className="flex-1 text-slate-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteDocument(doc._id)}
                      disabled={deleteDocumentPending}
                      className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Contrats générés</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {contracts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/50 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Documents uploadés</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {documents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="border-slate-200/50 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Espace utilisé</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {calculateTotalSize(documents).toFixed(2)} MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
