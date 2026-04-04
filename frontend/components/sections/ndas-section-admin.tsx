// frontend/components/sections/ndas-section-admin.tsx
"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Nda } from "@/lib/nda-service";
import type { Agent } from "@/lib/users-service";

interface NdasSectionAdminProps {
  ndas: Nda[];
  agents: Agent[];
  isLoading: boolean;
  onDownload: (nda: Nda) => void;
  onView: (nda: Nda) => void;
  onDelete: (ndaId: string) => void;
  onRegenerate?: (ndaId: string) => void;
  onArchive?: (ndaId: string) => void;
  onRestore?: (ndaId: string) => void;
  deleteNdaPending: boolean;
  regenerateNdaPending?: boolean;
  archiveNdaPending?: boolean;
  showArchived?: boolean;
  onToggleArchived?: (show: boolean) => void;
}

export function NdasSectionAdmin({
  ndas,
  agents,
  isLoading,
  onDownload,
  onDelete,
  deleteNdaPending,
}: NdasSectionAdminProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Filtrer les NDAs
  const filteredNdas = ndas.filter((nda) => {
    const agent = agents.find((a) => a._id === nda.userId);
    const agentName = agent ? `${agent.nom} ${agent.prenoms}` : "Agent inconnu";
    
    const matchesSearch =
      searchTerm === "" ||
      nda.ndaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAgent = filterAgent === "all" || nda.userId === filterAgent;

    return matchesSearch && matchesAgent;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNdas.length / ITEMS_PER_PAGE);
  const usePagination = filteredNdas.length > ITEMS_PER_PAGE;
  const paginatedNdas = usePagination
    ? filteredNdas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : filteredNdas;

  const handleSearch = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
  const handleFilterAgent = (val: string) => { setFilterAgent(val); setCurrentPage(1); };

  const getAgentInfo = (userId: string) => {
    const agent = agents.find((a) => a._id === userId);
    return agent ? `${agent.nom} ${agent.prenoms}` : "Agent inconnu";
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2 sm:-mt-2">
      {/* En-tête avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Gestion des NDA</h2>
          <p className="text-gray-400 mt-1">
            {filteredNdas.length} NDA{filteredNdas.length > 1 ? "s" : ""} trouvé{filteredNdas.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-[#1F2128] text-white border border-[#313442] p-3 rounded-lg">
        <div className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F1F1F1]" />
              <Input
                placeholder="Rechercher un NDA..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 sm:pl-10 bg-[#2C2E3A] border-[#313442] text-xs sm:text-sm h-8 sm:h-9 text-white placeholder:text-[#F1F1F1]"
              />
            </div>

            <Select value={filterAgent} onValueChange={handleFilterAgent}>
              <SelectTrigger className="bg-[#2C2E3A] border-[#313442] text-white text-xs sm:text-sm h-8 sm:h-9">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="bg-[#2C2E3A] border-[#313442] text-white max-h-[300px]">
                <SelectItem value="all">Tous les agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.nom} {agent.prenoms} {agent.archived && "(Archivé)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Liste des NDAs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      ) : filteredNdas.length === 0 ? (
        <Card className="bg-[#1F2128] border border-[#313442]">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-[#F1F1F1] mx-auto mb-4" />
            <p className="text-white text-base sm:text-lg font-medium">Aucun NDA trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {paginatedNdas.map((nda) => {
            const agent = agents.find((a) => a._id === nda.userId);
            const isArchived = nda.isArchived;
            
            return (
              <div 
                key={nda._id} 
                className={`hover:shadow-lg transition-all duration-300 bg-[#1F2128] border border-[#313442] rounded-lg ${
                  isArchived ? 'opacity-70' : ''
                }`}
              >
                <CardContent className="p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3">
                        <FileText className="w-6 h-6 text-purple-400" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg text-white">
                            {getAgentInfo(nda.userId)}
                          </h3>
                        </div>
                        <div className="text-xs text-[#F1F1F1]">
                          Fichier: {nda.fileName}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(nda)}
                        className="border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(nda._id)}
                        disabled={deleteNdaPending}
                        className="border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && usePagination && filteredNdas.length > 0 && (
        <div className="flex items-center justify-between bg-[#1F2128] border border-[#313442] rounded-lg px-4 py-3">
          <p className="text-xs text-gray-400">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredNdas.length)} sur {filteredNdas.length} NDAs
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
                    ? "bg-purple-600 text-white"
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
  );
}