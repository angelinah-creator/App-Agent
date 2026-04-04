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

    const matchesType = filterType === "all"

    return matchesSearch && matchesType
  })

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
    <div className="space-y-4 sm:space-y-6 mt-2 sm:-mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* En-tête */}
      <div>
        <h1 className="text-white font-extrabold text-xl sm:text-2xl">
            Gestion des documents
        </h1>
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
      <Card className="bg-[#1F2128] border-[#313442] border">
        <CardContent className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <User className="w-4 h-4 mr-2 text-white" />
                <SelectValue placeholder="Sélectionner un agent"/>
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all" className="text-white">Sélectionner un agent...</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.nom} {agent.prenoms} - {agent.profile}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAgent !== "all" && (
              <>
                <div className="relative text-white">
                  <Search className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  <Input
                    placeholder="Rechercher un document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations de l'agent sélectionné */}
      {selectedAgent !== "all" && selectedAgentData && (
        <Card className="bg-[#1F2128] border border-[#313442] text-white">
          <CardContent className="">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#6C4EA8] flex items-center justify-center text-white font-bold text-2xl">
                {selectedAgentData.prenoms[0]}{selectedAgentData.nom[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">
                  {selectedAgentData.nom} {selectedAgentData.prenoms}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-white mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedAgentData.email}
                  </span>
                </div>
              </div>
              <div className="text-center sm:text-right">
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
        <Card className="bg-[#1F2128] border border-[#313442]">
          <CardContent className="py-16 text-center">
            <User className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <p className="text-base sm:text-lg text-slate-600 font-medium">Sélectionnez un agent</p>
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
        <Card className="bg-[#1F2128] border border-[#313442]">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucun document trouvé pour cet agent</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc._id} className="hover:shadow-lg transition-shadow bg-[#1F2128] border border-[#313442]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-gray-400/20 rounded-xl">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 space-y-2 min-w-0">
                    <h4 className="font-semibold text-white truncate text-sm">
                      {doc.originalName}
                    </h4>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-[#313442]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(doc)}
                    className="text-xs text-blue-500 bg-transparent border-1 border-blue-500"
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
                    className="text-red-400 text-xs border border-red-400 bg-transparent hover:bg-red-400 hover:text-white"
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