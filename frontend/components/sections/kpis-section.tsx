"use client";

import {
  BarChart3,
  Eye,
  Download,
  Trash2,
  Plus,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { KPI } from "@/lib/types";

interface KPIsSectionProps {
  kpis: KPI[];
  kpisLoading: boolean;
  onAddKPI: () => void;
  onViewKPI: (url: string) => void;
  onDownloadKPI: (kpi: KPI) => void;
  onDeleteKPI: (id: string) => void;
  deleteKPIPending: boolean;
}

export function KPIsSection({
  kpis,
  kpisLoading,
  onAddKPI,
  onViewKPI,
  onDownloadKPI,
  onDeleteKPI,
  deleteKPIPending,
}: KPIsSectionProps) {
  const getKPITypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      rapport_mensuel: "Rapport Mensuel",
      rapport_trimestriel: "Rapport Trimestriel",
      rapport_annuel: "Rapport Annuel",
      autre: "Autre",
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 -mt-2 sm:-mt-8">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-[#313442] bg-[#1F2128] backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white font-medium">Total rapports</p>
                <p className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {kpis.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-[#1F2128] backdrop-blur-sm rounded-2xl border border-[#313442] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-white">
            Mes Rapports KPI
          </h3>
          <Button
            onClick={onAddKPI}
            className="bg-[#6C4EA8] hover:bg-[#382d4e] text-white hover:scale-105 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Ajouter un rapport</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>

        {kpisLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-violet-200 border-t-violet-600 mx-auto"></div>
            <p className="text-white mt-2 font-medium text-sm">
              Chargement des KPIs...
            </p>
          </div>
        ) : kpis.length === 0 ? (
          <div className="text-center py-6 bg-[#303237] rounded-xl">
            <BarChart3 className="mx-auto h-10 w-10 text-white" />
            <p className="mt-3 text-white font-medium text-sm">
              Aucun rapport KPI uploadé
            </p>
            <p className="text-xs text-white mt-1">
              Cliquez sur "Ajouter un rapport" pour uploader vos premiers
              rapports
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {kpis.map((kpi: KPI) => (
              <Card
                key={kpi._id}
                className="border-[#313442] hover:shadow-lg hover:shadow-[#313442] transition-all duration-300 hover:scale-105 bg-[#1F2128] backdrop-blur-sm"
              >
                <CardContent className="">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BarChart3 className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">
                        {kpi.originalName}
                      </h4>
                      <p className="text-sm font-medium text-violet-600 mt-1">
                        Période:{" "}
                        {new Date(kpi.periode).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                        })}
                      </p>
                      {kpi.description && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {kpi.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#313442]">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadKPI(kpi)}
                      disabled={deleteKPIPending}
                      className="text-xs border border-blue-500/40 bg-transparent hover:bg-blue-600 hover:border-blue-600 text-blue-400 hover:text-white focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteKPI(kpi._id)}
                      disabled={deleteKPIPending}
                      className="text-xs border border-red-500/40 bg-transparent hover:bg-red-600 hover:border-red-600 text-red-400 hover:text-white focus:ring-red-500"
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
    </div>
  );
}
