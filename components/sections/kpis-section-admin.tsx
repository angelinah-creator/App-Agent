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
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 mt-1">
            {totalKPIs} rapport{totalKPIs > 1 ? "s" : ""} trouvé
            {totalKPIs > 1 ? "s" : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-600">{totalKPIs}</p>
            <p className="text-xs text-slate-600">Total rapports</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
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
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un rapport ou un agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger>
                <User className="w-4 h-4 mr-2" />
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

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
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

      {/* Statistiques par agent */}
      {/* {filterAgent === "all" && kpisByAgent.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Rapports par Agent
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpisByAgent.map(({ agent, count }) => (
                <div
                  key={agent._id}
                  className="p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200"
                >
                  <p className="text-xs text-slate-600 truncate">
                    {agent.nom} {agent.prenoms}
                  </p>
                  <p className="text-2xl font-bold text-violet-600">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

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
          {filteredKPIs.map((kpi) => {
            const agentInfo = getAgentInfo(kpi);

            return (
              <Card key={kpi._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-violet-600" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-slate-800">
                            {agentInfo.name}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                            Rapport Mensuel
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-slate-500">Email:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {agentInfo.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Profil:</span>
                            <span className="ml-2 font-medium text-slate-800 capitalize">
                              {agentInfo.profile}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Fichier:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {kpi.originalName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Taille:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatFileSize(kpi.fileSize)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Période:</span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatPeriode(kpi.periode)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">
                              Date d'ajout:
                            </span>
                            <span className="ml-2 font-medium text-slate-800">
                              {formatDate(kpi.createdAt)}
                            </span>
                          </div>
                          {kpi.description && (
                            <div className="col-span-2">
                              <span className="text-slate-500">
                                Description:
                              </span>
                              <span className="ml-2 font-medium text-slate-800">
                                {kpi.description}
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
                        onClick={() => onView(kpi)}
                        className="hover:bg-violet-50 hover:border-violet-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button> */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(kpi)}
                        className="hover:bg-green-50 hover:border-green-300"
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
    </div>
  );
}
