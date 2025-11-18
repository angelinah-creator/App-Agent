// frontend/components/sections/contracts-section-admin.tsx
"use client"

import { useState } from "react"
import { FileText, Download, Eye, Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Contract } from "@/lib/contract-service"
// import type { UserData } from "@/lib/types"
import type { Agent } from "@/lib/users-service"

interface ContractsAdminProps {
  contracts: Contract[]
  agents: Agent[]
  isLoading: boolean
  onDownload: (contract: Contract) => void
  onView: (contract: Contract) => void
  onDelete: (contractId: string) => void
  deleteContractPending: boolean
}

export function ContractsSectionAdmin({
  contracts,
  agents,
  isLoading,
  onDownload,
  onView,
  onDelete,
  deleteContractPending,
}: ContractsAdminProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterAgent, setFilterAgent] = useState<string>("all")

  // Filtrage
  const filteredContracts = contracts.filter((contract) => {
    const agent = agents.find((a) => a._id === contract.userId)
    const matchesSearch =
      searchTerm === "" ||
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent?.prenoms.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || contract.type === filterType
    const matchesAgent = filterAgent === "all" || contract.userId === filterAgent

    return matchesSearch && matchesType && matchesAgent
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 mt-1">
            {filteredContracts.length} contrat{filteredContracts.length > 1 ? "s" : ""} trouvé{filteredContracts.length > 1 ? "s" : ""}
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
                placeholder="Rechercher un contrat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type de contrat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="stagiaire">Stagiaires</SelectItem>
                <SelectItem value="prestataire">Prestataires</SelectItem>
              </SelectContent>
            </Select>

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

      {/* Liste des contrats */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucun contrat trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredContracts.map((contract) => (
            <Card key={contract._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                      <FileText className="w-6 h-6 text-violet-600" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-slate-800">
                          {getAgentInfo(contract.userId)}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            contract.type === "stagiaire"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {contract.type === "stagiaire" ? "Stagiaire" : "Prestataire"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-slate-500">Date création:</span>
                          <span className="ml-2 font-medium text-slate-800">
                            {formatDate(contract.createdAt)}
                          </span>
                        </div>
                        {contract.expiresAt && (
                          <div>
                            <span className="text-slate-500">Date expiration:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatDate(contract.expiresAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(contract)}
                      className="border-violet-300 hover:bg-violet-300"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </Button> */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(contract)}
                      className="border-blue-300 hover:bg-blue-600 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) {
                          onDelete(contract._id)
                        }
                      }}
                      disabled={deleteContractPending}
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