"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { UserData } from "@/lib/types"

interface ProfilSectionProps {
  userData: UserData
  onLogout: () => void
}

export function ProfilSection({ userData, onLogout }: ProfilSectionProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50">
        <CardContent className="p-8">
          <h3 className="text-2xl font-semibold mb-6 text-slate-800">Informations personnelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600">Nom complet</p>
              <p className="font-medium text-slate-800">
                {userData.prenoms} {userData.nom}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="font-medium text-slate-800">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Téléphone</p>
              <p className="font-medium text-slate-800">{userData.telephone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Poste</p>
              <p className="font-medium text-slate-800">{userData.poste}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Type</p>
              <p className="font-medium text-slate-800 capitalize">{userData.profile}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">CIN</p>
              <p className="font-medium text-slate-800">{userData.cin}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Adresse</p>
              <p className="font-medium text-slate-800">{userData.adresse}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Date de début</p>
              <p className="font-medium text-slate-800">{new Date(userData.dateDebut).toLocaleDateString("fr-FR")}</p>
            </div>
            {userData.dateFin && (
              <div>
                <p className="text-sm text-slate-600">Date de fin</p>
                <p className="font-medium text-slate-800">{new Date(userData.dateFin).toLocaleDateString("fr-FR")}</p>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200">
            <Button
              onClick={onLogout}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent transition-all duration-200 hover:scale-105"
            >
              Déconnexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
