"use client";

import { useState } from "react";
import { BarChart3, Download, Eye, Search, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KPI } from "@/lib/types";
import type { Agent } from "@/lib/users-service";

interface KPIsAdminProps {
  kpis: KPI[];
  agents: Agent[];
  isLoading: boolean;
  onDownload: (kpi: KPI) => void;
  onView: (kpi: KPI) => void;
}

export function KPIsSectionAdmin({
  kpis,
  agents,
  isLoading,
  onDownload,
  onView,
}: KPIsAdminProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Générer les années disponibles
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Générer les mois
  const availableMonths = [
    { value: "1", label: "Janvier" },
    { value: "2", label: "Février" },
    { value: "3", label: "Mars" },
    { value: "4", label: "Avril" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" },
    { value: "8", label: "Août" },
    { value: "9", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" },
  ];

  // Filtrage amélioré avec gestion des données peuplées
  const filteredKPIs = [...kpis]
    .filter((kpi) => {
      // Récupérer l'agent - gérer les données peuplées et non peuplées
      let agentName = "";
      let agentEmail = "";
      let agentId = "";

      if (kpi.userId && typeof kpi.userId === "object" && "nom" in kpi.userId) {
        // Données peuplées
        agentName = `${kpi.userId.prenoms} ${kpi.userId.nom}`.toLowerCase();
        agentEmail = kpi.userId.email.toLowerCase();
        agentId = kpi.userId._id; // Récupérer l'ID de l'objet peuplé
      } else {
        // Données non peuplées
        agentId = kpi.userId as string; // ID directement
        const agent = agents.find((a) => a._id === kpi.userId);
        if (agent) {
          agentName = `${agent.prenoms} ${agent.nom}`.toLowerCase();
          agentEmail = agent.email.toLowerCase();
        }
      }

      const matchesSearch =
        searchTerm === "" ||
        kpi.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agentName.includes(searchTerm.toLowerCase()) ||
        agentEmail.includes(searchTerm.toLowerCase());

      // CORRECTION : Comparer avec agentId au lieu de kpi.userId
      const matchesAgent = filterAgent === "all" || agentId === filterAgent;

      // Extraire le mois et l'année de la période (format: YYYY-MM)
      const kpiDate = new Date(kpi.periode + "-01");
      const kpiMonth = kpiDate.getMonth() + 1;
      const kpiYear = kpiDate.getFullYear();

      const matchesMonth =
        filterMonth === "all" || kpiMonth.toString() === filterMonth;
      const matchesYear =
        filterYear === "all" || kpiYear.toString() === filterYear;

      return matchesSearch && matchesAgent && matchesMonth && matchesYear;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Pagination
  const totalPages = Math.ceil(filteredKPIs.length / ITEMS_PER_PAGE);
  const usePagination = filteredKPIs.length > ITEMS_PER_PAGE;
  const paginatedKPIs = usePagination
    ? filteredKPIs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : filteredKPIs;

  const handleSearch = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
  const handleFilterAgent = (val: string) => { setFilterAgent(val); setCurrentPage(1); };
  const handleFilterMonth = (val: string) => { setFilterMonth(val); setCurrentPage(1); };
  const handleFilterYear = (val: string) => { setFilterYear(val); setCurrentPage(1); };

  // Fonction améliorée pour obtenir les infos de l'agent
  const getAgentInfo = (kpi: KPI) => {
    if (kpi.userId && typeof kpi.userId === "object" && "nom" in kpi.userId) {
      // Données peuplées directement depuis le KPI
      return {
        name: `${kpi.userId.prenoms} ${kpi.userId.nom}`,
        email: kpi.userId.email,
        profile: kpi.userId.profile,
      };
    } else {
      // Données non peuplées - chercher dans la liste des agents
      const agent = agents.find((a) => a._id === kpi.userId);
      return agent
        ? {
            name: `${agent.prenoms} ${agent.nom}`,
            email: agent.email,
            profile: agent.profile,
          }
        : {
            name: "Agent inconnu",
            email: "N/A",
            profile: "N/A",
          };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatPeriode = (periode: string) => {
    const date = new Date(periode + "-01");
    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  // Statistiques
  const totalKPIs = filteredKPIs.length;
  const kpisByAgent = agents
    .map((agent) => ({
      agent,
      count: filteredKPIs.filter((k) => {
        if (typeof k.userId === "string") {
          return k.userId === agent._id;
        } else if (
          k.userId &&
          typeof k.userId === "object" &&
          "_id" in k.userId
        ) {
          return k.userId._id === agent._id;
        }
        return false;
      }).length,
    }))
    .filter((item) => item.count > 0);

  return (
    <div className="space-y-4 sm:space-y-6 -mt-2 sm:-mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-white font-extrabold text-xl sm:text-2xl">
            Gestion des KPIs
         </h1>
          <p className="text-slate-600 mt-1">
            {totalKPIs} rapport{totalKPIs > 1 ? "s" : ""} trouvé
            {totalKPIs > 1 ? "s" : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-violet-600">{totalKPIs}</p>
            <p className="text-xs text-slate-600">Total rapports</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              {
                new Set(
                  filteredKPIs.map((k) => {
                    if (typeof k.userId === "string") return k.userId;
                    if (
                      k.userId &&
                      typeof k.userId === "object" &&
                      "_id" in k.userId
                    )
                      return k.userId._id;
                    return "";
                  })
                ).size
              }
            </p>
            <p className="text-xs text-slate-600">Agents</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="bg-[#1F2128] border-[#313442]">
        <CardContent className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              <Input
                placeholder="Rechercher un rapport ou un agent..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 sm:pl-10 bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>

            <Select value={filterAgent} onValueChange={handleFilterAgent}>
              <SelectTrigger  className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all">Tous les agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.nom} {agent.prenoms}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={handleFilterMonth}>
              <SelectTrigger  className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={handleFilterYear}>
              <SelectTrigger className="text-white bg-[#2C2E3A] border border-[#2C2E3A] text-xs sm:text-sm h-8 sm:h-9">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent className="text-white bg-[#2C2E3A] border border-[#2C2E3A]">
                <SelectItem value="all">Toutes les années</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des KPIs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
        </div>
      ) : filteredKPIs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucun rapport trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {paginatedKPIs.map((kpi) => {
            const agentInfo = getAgentInfo(kpi);

            return (
              <Card key={kpi._id} className="hover:shadow-lg transition-shadow text-white bg-[#1F2128] border-[#313442]">
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-gray-500/30 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-violet-600" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="font-semibold text-base sm:text-lg text-white">
                            {agentInfo.name}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                            Rapport Mensuel
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-slate-500">Email:</span>
                            <span className="ml-2 font-medium text-white">
                              {agentInfo.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Profil:</span>
                            <span className="ml-2 font-medium text-white capitalize">
                              {agentInfo.profile}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Fichier:</span>
                            <span className="ml-2 font-medium text-white">
                              {kpi.originalName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Taille:</span>
                            <span className="ml-2 font-medium text-white">
                              {formatFileSize(kpi.fileSize)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Période:</span>
                            <span className="ml-2 font-medium text-white">
                              {formatPeriode(kpi.periode)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">
                              Date d'ajout:
                            </span>
                            <span className="ml-2 font-medium text-white">
                              {formatDate(kpi.createdAt)}
                            </span>
                          </div>
                          {kpi.description && (
                            <div className="col-span-2">
                              <span className="text-slate-500">
                                Description:
                              </span>
                              <span className="ml-2 font-medium text-white">
                                {kpi.description}
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
                        onClick={() => onDownload(kpi)}
                        className="border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                      >
                        <Download className="w-4 h-4" />
                        Telecharger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && usePagination && filteredKPIs.length > 0 && (
        <div className="flex items-center justify-between bg-[#1F2128] border border-[#313442] rounded-lg px-4 py-3">
          <p className="text-xs text-gray-400">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredKPIs.length)} sur {filteredKPIs.length} rapports
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
  );
}
