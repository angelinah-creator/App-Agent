"use client"

import { useState } from "react"
import { Shield, Download, Eye, Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Nda } from "@/lib/nda-service"
import type { Agent } from "@/lib/users-service"

interface NdaSectionAdminProps {
  ndas: Nda[]
  agents: Agent[]
  isLoading: boolean
  onDownload: (nda: Nda) => void
  onView: (nda: Nda) => void
  onDelete: (ndaId: string) => void
  deleteNdaPending: boolean
}

export function NdaSectionAdmin({
  ndas,
  agents,
  isLoading,
  onDownload,
  onView,
  onDelete,
  deleteNdaPending,
}: NdaSectionAdminProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAgent, setFilterAgent] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Filtrage
  const filteredNdas = ndas.filter((nda) => {
    const agent = agents.find((a) => a._id === nda.userId)
    const matchesSearch =
      searchTerm === "" ||
      nda.ndaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent?.prenoms.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAgent = filterAgent === "all" || nda.userId === filterAgent
    const matchesStatus = filterStatus === "all" || nda.status === filterStatus

    return matchesSearch && matchesAgent && matchesStatus
  })

  const getAgentInfo = (userId: string) => {
    const agent = agents.find((a) => a._id === userId)
    return agent ? `${agent.nom} ${agent.prenoms}` : "Agent inconnu"
  }

  const getAgentProfile = (userId: string) => {
    const agent = agents.find((a) => a._id === userId)
    return agent?.profile || "unknown"
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      generated: "Généré",
      signed: "Signé",
      active: "Actif",
      expired: "Expiré",
    }
    return statusLabels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      generated: "bg-blue-100 text-blue-700",
      signed: "bg-green-100 text-green-700",
      active: "bg-purple-100 text-purple-700",
      expired: "bg-gray-100 text-gray-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 mt-1">
            {filteredNdas.length} NDA{filteredNdas.length > 1 ? "s" : ""} trouvé{filteredNdas.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un NDA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.nom} {agent.prenoms}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des NDA */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      ) : filteredNdas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucun NDA trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNdas.map((nda) => (
            <Card key={nda._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-slate-800">
                          {getAgentInfo(nda.userId)}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="col-span-2">
                          <span className="text-slate-500">Nom du fichier:</span>
                          <span className="ml-2 font-medium text-slate-800">
                            {nda.fileName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(nda)}
                      className="border-blue-300 hover:bg-blue-600 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onDelete(nda._id)
                      }}
                      disabled={deleteNdaPending}
                      className="border-red-300 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}