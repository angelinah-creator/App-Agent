"use client";

import {
  FileText,
  Receipt,
  BarChart3,
  Calendar,
  User,
  Users,
  File,
  FileCheck,
  LogOut,
  Video,
  Clock,
  CalendarCheck,
  Briefcase,
  LayoutDashboard,
  CalendarX,
  CircleUser,
  Handshake,
  BarChart2,
  FolderOpen,
  Layers,
} from "lucide-react";
import { authService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { id } from "date-fns/locale";

// Mapping des enfants de chaque groupe pour maintenir l'onglet actif
const GROUP_CHILDREN: Record<string, string[]> = {
  groupe_dossiers: ["contracts", "ndas", "documents", "factures", "kpis"],
  groupe_espaces: ["projets", "espaces_des_agents", "espaces_partages", "rapports_collabo"],
};

const isItemActive = (itemId: string, activeSection: string): boolean => {
  if (itemId === activeSection) return true;
  return (GROUP_CHILDREN[itemId] ?? []).includes(activeSection);
};

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userRole: "admin" | "manager" | "collaborateur" | "client";
  userProfile?: "stagiaire" | "prestataire";
}

export function Sidebar({
  activeSection,
  onSectionChange,
  onLogout,
  userRole,
  userProfile,
}: SidebarProps) {
  const router = useRouter();

  const getMenuItems = () => {
    const baseItems = [
      { id: "documents", label: "Documents", icon: FileText },
      { id: "kpis", label: "KPIs", icon: BarChart3 },
    ];

    const adminItems = [
      { id: "video_admin", label: "Onboarding", icon: Video },
      { id: "agents", label: "Agents", icon: Users },
      { id: "groupe_dossiers", label: "Dossiers Agents", icon: FolderOpen },
      { id: "groupe_espaces", label: "Espaces & Projets", icon: Layers },
      { id: "absences", label: "Absences", icon: CalendarX },
      { id: "rendez_vous", label: "Rendez-vous", icon: CalendarCheck },
      { id: "profil", label: "Profil", icon: User },
    ];

    const managerItems = [
      // { id: "tableau_de_bord", label: "Tableau de bord", icon: FileText },
      { id: "video", label: "Onboarding", icon: Video },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "factures", label: "Factures", icon: Receipt },
      { id: "kpis", label: "KPIs", icon: BarChart3 },
      { id: "absences", label: "Demande d'Absences", icon: CalendarX },
      { id: "projets", label: "Projets", icon: Briefcase },
      { id: "taches", label: "Espace Personnel", icon: CircleUser },
      { id: "espaces_des_agents", label: "Espaces Collaborateur", icon: Users },
      { id: "espaces_partages", label: "Espaces Partagés", icon: Handshake },
      { id: "timer", label: "Timer", icon: Clock },
      { id: "rapports", label: "Rapports", icon: BarChart2 },
      {
        id: "rapports_collabo",
        label: "Rapports Collaborateur",
        icon: FileText,
      },
      { id: "rendez_vous", label: "Rendez-vous", icon: CalendarCheck },
      {id: "profil", label: "Profil", icon: User}
      // { id: "certifications", label: "Certifications", icon: FileText },
      // { id: "suivi_des_agents", label: "Suivi des Agents", icon: Calendar },
      // { id: "taches_en_retard", label: "Taches en Retard", icon: Calendar },
      // { id: "formations", label: "Formations", icon: Calendar },
    ];

    const collaborateurItems = [
      { id: "video", label: "Onboarding", icon: Video },
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "factures", label: "Factures", icon: Receipt },
      { id: "kpis", label: "KPIs", icon: BarChart3 },
      { id: "absences", label: "Absences", icon: CalendarX },
      { id: "projets", label: "Projets", icon: Briefcase },
      { id: "taches", label: "Taches Personnelles", icon: CircleUser },
      { id: "espaces_partages", label: "Espaces Partagés", icon: Handshake },
      { id: "timer", label: "Timer", icon: Clock },
      { id: "rapports", label: "Rapports", icon: BarChart2 },
      // { id: "certifications", label: "Certifications", icon: FileText },
      { id: "rendez_vous", label: "Rendez-vous", icon: CalendarCheck },
      {id: "profil", label: "Profil", icon: User}
    ];

    const clientItems = [{ id: "profil_client", label: "Profil", icon: User }];

    switch (userRole) {
      case "admin":
        return adminItems;
      case "manager":
        return managerItems;
      case "collaborateur":
        return collaborateurItems;
      case "client":
        return clientItems;
      default:
        return baseItems;
    }
  };

  let sous_titre = "";

  if (userRole === "manager") {
    sous_titre = "ESPACE MANAGER";
  } else if (userRole === "admin") {
    sous_titre = "ESPACE ADMIN";
  } else if (userRole === "collaborateur") {
    sous_titre = "ESPACE AGENT";
  } else if (userRole === "client") {
    sous_titre = "ESPACE CLIENT";
  }

  const menuItems = getMenuItems();

  return (
    <>
      <div className="w-full bg-[#1F2128] text-gray-300 flex flex-col h-screen border-r border-2 border-[#313442]">
        {/* Logo */}
        <div className="px-4 py-6 text-center">
          <img src="/images/logo3.png" className="w-14 mx-auto" />
          <p className="text-xs text-[#FFFFFF] mt-3 uppercase tracking-wide font-bold">
            {sous_titre}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm transition 
                ${
                  isItemActive(item.id, activeSection)
                    ? "bg-[#6C4EA8] text-white shadow-md"
                    : "hover:bg-white/5 text-[#FFFFFF]"
                }
              `}
            >
              {item.icon ? <item.icon className="w-4 h-4" /> : null}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom settings / logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#FFFFFF] hover:bg-white/5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs">Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
}
