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

  const getAgentInfo = (userId: string) => {
    const agent = agents.find((a) => a._id === userId);
    return agent ? `${agent.nom} ${agent.prenoms}` : "Agent inconnu";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-8">
      {/* En-tête avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Gestion des NDA</h2>
          <p className="text-gray-400 mt-1">
            {filteredNdas.length} NDA{filteredNdas.length > 1 ? "s" : ""} trouvé{filteredNdas.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-[#1F2128] text-white border border-[#313442] p-3 rounded-lg">
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#F1F1F1]" />
              <Input
                placeholder="Rechercher un NDA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#2C2E3A] border-[#313442] text-white placeholder:text-[#F1F1F1]"
              />
            </div>

            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="bg-[#2C2E3A] border-[#313442] text-white">
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
            <p className="text-white text-lg font-medium">Aucun NDA trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNdas.map((nda) => {
            const agent = agents.find((a) => a._id === nda.userId);
            const isArchived = nda.isArchived;
            
            return (
              <div 
                key={nda._id} 
                className={`hover:shadow-lg transition-all duration-300 bg-[#1F2128] border border-[#313442] rounded-lg ${
                  isArchived ? 'opacity-70' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3">
                        <FileText className="w-6 h-6 text-purple-400" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg text-white">
                            {getAgentInfo(nda.userId)}
                          </h3>
                        </div>
                        <div className="text-xs text-[#F1F1F1]">
                          Fichier: {nda.fileName}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(nda)}
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(nda._id)}
                        disabled={deleteNdaPending}
                        className="border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white"
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
    </div>
  );
}