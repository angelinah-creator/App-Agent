// frontend/components/sections/documents-section-admin.tsx
"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Eye, Trash2, Search, User, Mail, Phone, Calendar, File, Folder, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Document } from "@/lib/document-service"
import type { Agent } from "@/lib/users-service"
import { api } from "@/lib/api-config"

interface DocumentsAdminProps {
  agents: Agent[]
  onDownload: (document: Document) => void
  onView: (document: Document) => void
  onDelete: (documentId: string) => void
  deleteDocumentPending: boolean
}

export function DocumentsSectionAdmin({
  agents,
  onDownload,
  onView,
  onDelete,
  deleteDocumentPending,
}: DocumentsAdminProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  // Charger les documents quand un agent est sélectionné
  useEffect(() => {
    const fetchDocuments = async () => {
      if (selectedAgent === "all") {
        setDocuments([])
        return
      }

      setIsLoading(true)
      try {
        const response = await api.get(`/documents/user/${selectedAgent}`)
        setDocuments(response.data)
      } catch (error) {
        console.error("Erreur chargement documents:", error)
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [selectedAgent])

  // Filtrage
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === "" ||
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || doc.type === filterType

    return matchesSearch && matchesType
  })

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cin_recto: "CIN Recto",
      cin_verso: "CIN Verso",
      certificat_residence: "Certificat de résidence",
      diplome: "Diplôme",
      cv: "CV",
      autre: "Autre",
    }
    return labels[type] || type
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const selectedAgentData = agents.find(a => a._id === selectedAgent)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 mt-1">
            {selectedAgent === "all" 
              ? "Sélectionnez un agent pour voir ses documents" 
              : `${filteredDocuments.length} document${filteredDocuments.length > 1 ? "s" : ""} trouvé${filteredDocuments.length > 1 ? "s" : ""}`
            }
          </p>
        </div>
      </div>

      {/* Sélection de l'agent */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sélectionner un agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sélectionner un agent...</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.nom} {agent.prenoms} - {agent.profile}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAgent !== "all" && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="cin_recto">CIN Recto</SelectItem>
                    <SelectItem value="cin_verso">CIN Verso</SelectItem>
                    <SelectItem value="certificat_residence">Certificat de résidence</SelectItem>
                    <SelectItem value="diplome">Diplôme</SelectItem>
                    <SelectItem value="cv">CV</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations de l'agent sélectionné */}
      {selectedAgent !== "all" && selectedAgentData && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                {selectedAgentData.prenoms[0]}{selectedAgentData.nom[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800">
                  {selectedAgentData.nom} {selectedAgentData.prenoms}
                </h3>
                <div className="flex gap-4 text-sm text-slate-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedAgentData.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {selectedAgentData.telephone}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <User className="w-4 h-4" />
                    {selectedAgentData.profile}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{documents.length}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1 justify-end">
                  <Folder className="w-3 h-3" />
                  Documents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des documents */}
      {selectedAgent === "all" ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-600 font-medium">Sélectionnez un agent</p>
            <p className="text-sm text-slate-500 mt-2">
              Choisissez un agent dans la liste pour voir ses documents
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucun document trouvé pour cet agent</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700">
                        {getDocumentTypeLabel(doc.type)}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-800 truncate text-sm">
                      {doc.originalName}
                    </h4>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p className="flex items-center gap-1">
                        <File className="w-3 h-3" />
                        {formatFileSize(doc.fileSize)}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.createdAt)}
                      </p>
                      {doc.description && (
                        <p className="truncate flex items-center gap-1" title={doc.description}>
                          <Info className="w-3 h-3" />
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(doc)}
                    className="hover:bg-blue-600 hover:border-green-300 text-xs"
                  >
                    <Download className="w-3 h-3" />
                    Telecharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onDelete(doc._id)
                    }}
                    disabled={deleteDocumentPending}
                    className="hover:bg-red-600 hover:border-red-300 text-red-600 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}