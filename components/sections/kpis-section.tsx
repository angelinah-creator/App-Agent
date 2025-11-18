"use client"

import { BarChart3, Eye, Download, Trash2, Plus, TrendingUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { KPI } from "@/lib/types"

interface KPIsSectionProps {
  kpis: KPI[]
  kpisLoading: boolean
  onAddKPI: () => void
  onViewKPI: (url: string) => void
  onDownloadKPI: (kpi: KPI) => void
  onDeleteKPI: (id: string) => void
  deleteKPIPending: boolean
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
    }
    return typeLabels[type] || type
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200/50 hover:shadow-xl hover:shadow-violet-200/50 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-violet-50/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Total rapports</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {kpis.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    
      </div>


      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Mes Rapports KPI</h3>
          <Button
            onClick={onAddKPI}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un rapport
          </Button>
        </div>

        {kpisLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-200 border-t-violet-600 mx-auto"></div>
            <p className="text-slate-600 mt-3 font-medium">Chargement des KPIs...</p>
          </div>
        ) : kpis.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-xl">
            <BarChart3 className="mx-auto h-14 w-14 text-slate-400" />
            <p className="mt-4 text-slate-600 font-medium">Aucun rapport KPI uploadé</p>
            <p className="text-sm text-slate-500 mt-1">
              Cliquez sur "Ajouter un rapport" pour uploader vos premiers rapports
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi: KPI) => (
              <Card
                key={kpi._id}
                className="border-slate-200/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BarChart3 className="w-6 h-6 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{kpi.originalName}</h4>
                      <p className="text-sm font-medium text-violet-600 mt-1">
                        Période: {new Date(kpi.periode).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Créé le {new Date(kpi.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {kpi.description && <p className="text-xs text-slate-500 mt-1 truncate">{kpi.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    {/* <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewKPI(kpi.fileUrl)}
                      className="flex-1 text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button> */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadKPI(kpi)}
                      disabled={deleteKPIPending}
                      className="flex-1 text-slate-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteKPI(kpi._id)}
                      disabled={deleteKPIPending}
                      className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
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
  )
}
