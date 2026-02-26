"use client";

import {
  CheckCircle,
  Clock,
  Power,
  BarChart3,
  PlusCircle,
  FileText,
  GraduationCap,
} from "lucide-react";

export function DashboardSection() {
  return (
    <div className="p-4 text-gray-200">
      {/* TITRE */}
      <div className="mb-6 flex justify-between items-center -mt-14">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Bienvenue, voici votre résumé</p>
        </div>
        <div>
          <button className="bg-[#6C4EA8] py-1.5 px-3 rounded-[6px] text-sm">
            Commencer le shift
          </button>
        </div>
      </div>

      {/* WIDGETS DU HAUT */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Tâches complétées */}
        <div className="bg-[#1A1C22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-green-200 flex items-center justify-center">
              <CheckCircle className="text-green-600 w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Taches complétées</span>
          </div>
          <p className="text-2xl font-bold">0</p>
        </div>

        {/* Tâches en progression */}
        <div className="bg-[#1A1C22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-blue-200 flex items-center justify-center">
              <Clock className="text-blue-600 w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Taches en progression</span>
          </div>
          <p className="text-2xl font-bold">0</p>
        </div>

        {/* Tâches à faire */}
        <div className="bg-[#1A1C22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-purple-200 flex items-center justify-center">
              <Power className="text-purple-600 w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Taches à faire</span>
          </div>
          <p className="text-2xl font-bold">0</p>
        </div>

        {/* Heures de travail */}
        <div className="bg-[#1A1C22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-sky-200 flex items-center justify-center">
              <BarChart3 className="text-sky-600 w-4 h-4" />
            </div>
            <span className="text-sm font-medium">
              Heures de travail cette semaine
            </span>
          </div>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      {/* BLOC DU BAS */}
      <div className="grid grid-cols-2 gap-4">
        {/* Actions rapides */}
        <div className="bg-[#1A1C22] rounded-xl p-4 border border-gray-800">
          <h2 className="text-base font-semibold mb-3">Actions rapides</h2>

          <div className="space-y-2">
            {/* Nouvelle tâche */}
            <button className="flex items-center gap-2 bg-[#1F2128] hover:bg-[#262830] transition w-full p-3 rounded-lg border border-gray-700 text-left text-sm">
              <PlusCircle className="text-gray-300 w-4 h-4" />
              <span>Créer une nouvelle tache</span>
            </button>

            {/* Voir rapports */}
            <button className="flex items-center gap-2 bg-[#1F2128] hover:bg-[#262830] transition w-full p-3 rounded-lg border border-gray-700 text-left text-sm">
              <FileText className="text-gray-300 w-4 h-4" />
              <span>Voir les rapports</span>
            </button>

            {/* Formations */}
            <button className="flex items-center gap-2 bg-[#1F2128] hover:bg-[#262830] transition w-full p-3 rounded-lg border border-gray-700 text-left text-sm">
              <GraduationCap className="text-gray-300 w-4 h-4" />
              <span>Formations & Certifications</span>
            </button>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-[#1A1C22] rounded-xl p-4 border border-gray-800">
          <h2 className="text-base font-semibold mb-3">Activité récente</h2>

          <div className="space-y-3">
            {/* Item 1 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/images/avatar.webp"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium text-sm">Herizo Naina</p>
                  <p className="text-xs text-gray-400">
                    a terminé l'onboarding
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>21 Nov</p>
                <p>Il y a 2h</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/images/avatar.webp"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium text-sm">Mirindramptia</p>
                  <p className="text-xs text-gray-400">
                    a complété 3 formations
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>21 Nov</p>
                <p>Il y a 2h</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/images/avatar.webp"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium text-sm">N'tsisaro</p>
                  <p className="text-xs text-gray-400">
                    a démarré une nouvelle tâche
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>21 Nov</p>
                <p>Il y a 2h</p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/images/avatar.webp"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium text-sm">Kevinfal</p>
                  <p className="text-xs text-gray-400">
                    a démarré une nouvelle tâche
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>21 Nov</p>
                <p>Il y a 2h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
