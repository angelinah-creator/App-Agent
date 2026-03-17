"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Power,
  BarChart3,
  PlusCircle,
  FileText,
  GraduationCap,
} from "lucide-react";
import { personalTaskService, sharedTaskService, TaskStatus } from "@/lib/task-service";
import { timerService } from "@/lib/timer-service";

// Fonction pour obtenir les dates de la semaine courante (lundi -> dimanche)
const getCurrentWeekDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, ...
  const monday = new Date(now);
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
};

// Formatage des secondes en HH:MM:SS
const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
};

interface DashboardSectionProps {
  onSectionChange: (section: string) => void;
}

export function DashboardSection({ onSectionChange }: DashboardSectionProps) {
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [inProgressTasksCount, setInProgressTasksCount] = useState(0);
  const [todoTasksCount, setTodoTasksCount] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState('00:00:00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Récupérer les tâches personnelles et partagées en parallèle
        const [personalTasks, sharedTasks, timeEntries] = await Promise.all([
          personalTaskService.getMyTasks(),
          sharedTaskService.getMySharedTasks(),
          timerService.getEntries(getCurrentWeekDates().start, getCurrentWeekDates().end),
        ]);

        const allTasks = [...personalTasks, ...sharedTasks];

        setCompletedTasksCount(allTasks.filter(t => t.status === TaskStatus.TERMINEE).length);
        setInProgressTasksCount(allTasks.filter(t => t.status === TaskStatus.EN_COURS).length);
        setTodoTasksCount(allTasks.filter(t => t.status === TaskStatus.A_FAIRE).length);

        const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
        setWeeklyHours(formatDuration(totalSeconds));
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-2 sm:p-4 text-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* TITRE */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:-mt-14">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Bienvenue, voici votre dashboard</p>
        </div>
        <div className="w-full sm:w-auto">
          <button onClick={() => onSectionChange('timer')} className="w-full sm:w-auto bg-[#6C4EA8] py-1.5 px-4 rounded-[6px] text-sm font-medium hover:bg-[#5a3f8e] transition-colors">
            Commencer le shift
          </button>
        </div>
      </div>

      {/* WIDGETS DU HAUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tâches complétées */}
        <div className="bg-[#1A1C22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-green-200 flex items-center justify-center">
              <CheckCircle className="text-green-600 w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Taches complétées</span>
          </div>
          {loading ? (
            <div className="h-8 w-12 bg-gray-700 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-bold">{completedTasksCount}</p>
          )}
        </div>

        {/* Tâches en progression */}
        <div className="bg-[#1A1C22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-blue-200 flex items-center justify-center">
              <Clock className="text-blue-600 w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Taches en progression</span>
          </div>
          {loading ? (
            <div className="h-8 w-12 bg-gray-700 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-bold">{inProgressTasksCount}</p>
          )}
        </div>

        {/* Tâches à faire */}
        <div className="bg-[#1A1C22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-md bg-purple-200 flex items-center justify-center">
              <Power className="text-purple-600 w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Taches à faire</span>
          </div>
          {loading ? (
            <div className="h-8 w-12 bg-gray-700 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-bold">{todoTasksCount}</p>
          )}
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
          {loading ? (
            <div className="h-8 w-20 bg-gray-700 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-bold">{weeklyHours}</p>
          )}
        </div>
      </div>

      {/* BLOC DU BAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Actions rapides */}
        <div className="bg-[#1A1C22] rounded-xl p-4 border border-gray-800">
          <h2 className="text-base font-semibold mb-3">Actions rapides</h2>

          <div className="space-y-2">
            {/* Nouvelle tâche */}
            <button onClick={() => onSectionChange('taches')} className="flex items-center gap-2 bg-[#1F2128] hover:bg-[#262830] transition w-full p-3 rounded-lg border border-gray-700 text-left text-sm">
              <PlusCircle className="text-gray-300 w-4 h-4" />
              <span>Créer une nouvelle tache</span>
            </button>

            {/* Voir rapports */}
            <button onClick={() => onSectionChange('rapports')} className="flex items-center gap-2 bg-[#1F2128] hover:bg-[#262830] transition w-full p-3 rounded-lg border border-gray-700 text-left text-sm">
              <FileText className="text-gray-300 w-4 h-4" />
              <span>Voir les rapports</span>
            </button>

            {/* Formations */}
            {/* <button className="flex items-center gap-2 bg-[#1F2128] hover:bg-[#262830] transition w-full p-3 rounded-lg border border-gray-700 text-left text-sm">
              <GraduationCap className="text-gray-300 w-4 h-4" />
              <span>Formations & Certifications</span>
            </button> */}
          </div>
        </div>

        {/* Activité récente */}
        {/* <div className="bg-[#1A1C22] rounded-xl p-4 border border-gray-800">
          <h2 className="text-base font-semibold mb-3">Activité récente</h2>

          <div className="space-y-3">
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
        </div> */}
      </div>
    </div>
  );
}
