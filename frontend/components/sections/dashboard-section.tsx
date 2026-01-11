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
    <div className="p-6 text-gray-200">

      {/* TITRE */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Bienvenue, voici votre résumé</p>
        </div>
        <div>
          <button className="bg-[#6C4EA8] py-2 px-4 rounded-[6px]">Commencer le shift</button>
        </div> 
      </div>

      {/* WIDGETS DU HAUT */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {/* Tâches complétées */}
        <div className="bg-[#1A1C22] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-green-200 flex items-center justify-center">
              <CheckCircle className="text-green-600" />
            </div>
            <span className="text-lg font-medium">Taches complétées</span>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>

        {/* Tâches en progression */}
        <div className="bg-[#1A1C22] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-blue-200 flex items-center justify-center">
              <Clock className="text-blue-600" />
            </div>
            <span className="text-lg font-medium">Taches en progression</span>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>

        {/* Tâches à faire */}
        <div className="bg-[#1A1C22] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-purple-200 flex items-center justify-center">
              <Power className="text-purple-600" />
            </div>
            <span className="text-lg font-medium">Taches à faire</span>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>

        {/* Heures de travail */}
        <div className="bg-[#1A1C22] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-sky-200 flex items-center justify-center">
              <BarChart3 className="text-sky-600" />
            </div>
            <span className="text-lg font-medium">Heures de travail cette semaine</span>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>

      {/* BLOC DU BAS */}
      <div className="grid grid-cols-2 gap-6">

        {/* Actions rapides */}
        <div className="bg-[#1A1C22] rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>

          <div className="space-y-3">

            {/* Nouvelle tâche */}
            <button className="flex items-center gap-3 bg-[#1F2128] hover:bg-[#262830] transition w-full p-4 rounded-lg border border-gray-700 text-left">
              <PlusCircle className="text-gray-300" />
              <span>Créer une nouvelle tache</span>
            </button>

            {/* Voir rapports */}
            <button className="flex items-center gap-3 bg-[#1F2128] hover:bg-[#262830] transition w-full p-4 rounded-lg border border-gray-700 text-left">
              <FileText className="text-gray-300" />
              <span>Voir les rapports</span>
            </button>

            {/* Formations */}
            <button className="flex items-center gap-3 bg-[#1F2128] hover:bg-[#262830] transition w-full p-4 rounded-lg border border-gray-700 text-left">
              <GraduationCap className="text-gray-300" />
              <span>Formations & Certifications</span>
            </button>

          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-[#1A1C22] rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Activité récente</h2>

          <div className="space-y-5">

            {/* Item 1 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/images/avatar.webp" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">Herizo Naina</p>
                  <p className="text-sm text-gray-400">a terminé l'onboarding</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>21 Nov</p>
                <p>Il y a 2h</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/images/avatar.webp" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">Mirindramptia</p>
                  <p className="text-sm text-gray-400">a complété 3 formations</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>21 Nov</p>
                <p>Il y a 2h</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/images/avatar.webp" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">N’tsisaro</p>
                  <p className="text-sm text-gray-400">a démarré une nouvelle tâche</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>21 Nov</p>
                <p>Il y a 2h</p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/images/avatar.webp" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">Kevinfal</p>
                  <p className="text-sm text-gray-400">a démarré une nouvelle tâche</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
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
