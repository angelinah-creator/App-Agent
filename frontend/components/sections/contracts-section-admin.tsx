// frontend/components/sections/contracts-section-admin.tsx
"use client"

import { useState } from "react"
import { FileText, Download, Eye, Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Contract } from "@/lib/contract-service"
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
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

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

  // Pagination
  const totalPages = Math.ceil(filteredContracts.length / ITEMS_PER_PAGE)
  const usePagination = filteredContracts.length > ITEMS_PER_PAGE
  const paginatedContracts = usePagination
    ? filteredContracts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : filteredContracts

  const handleSearch = (val: string) => { setSearchTerm(val); setCurrentPage(1); }
  const handleFilterType = (val: string) => { setFilterType(val); setCurrentPage(1); }
  const handleFilterAgent = (val: string) => { setFilterAgent(val); setCurrentPage(1); }

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
    <div className="space-y-4 sm:space-y-6 -mt-2 sm:-mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* En-tête */}
        <div>
          <h1 className="text-white font-extrabold text-xl sm:text-2xl">
            Gestion des contrats
          </h1>
          <p className="text-slate-600 mt-1">
            {filteredContracts.length} contrat{filteredContracts.length > 1 ? "s" : ""} trouvé{filteredContracts.length > 1 ? "s" : ""}
          </p>
        </div>

      {/* Filtres */}
      <div className="bg-[#1F2128] text-white border border-[#313442] p-3 rounded-lg">
        <div className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un contrat..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>

            <Select value={filterType} onValueChange={handleFilterType}>
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

            <Select value={filterAgent} onValueChange={handleFilterAgent}>
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
        </div>
      </div>

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
          {paginatedContracts.map((contract) => (
            <div key={contract._id} className="hover:shadow-lg transition-shadow bg-[#1F2128] border border-[#313442] rounded-lg">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br bg-[#1F2128] rounded-xl">
                      <FileText className="w-6 h-6 text-violet-600" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="font-semibold text-base sm:text-lg text-white">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {contract.expiresAt && (
                          <div>
                            <span className="text-slate-500">Date expiration:</span>
                            <span className="ml-2 font-medium text-white">
                              {formatDate(contract.expiresAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(contract)}
                      className="border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onDelete(contract._id)
                      }}
                      disabled={deleteContractPending}
                      className="border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && usePagination && filteredContracts.length > 0 && (
        <div className="flex items-center justify-between bg-[#1F2128] border border-[#313442] rounded-lg px-4 py-3">
          <p className="text-xs text-gray-400">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredContracts.length)} sur {filteredContracts.length} contrats
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#313442] text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ← Préc.
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  page === currentPage
                    ? "bg-violet-600 text-white"
                    : "border border-[#313442] text-gray-400 hover:bg-white/5"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#313442] text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Suiv. →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}