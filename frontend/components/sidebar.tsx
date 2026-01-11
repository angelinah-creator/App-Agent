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
  Clock
} from "lucide-react";
import { authService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { id } from "date-fns/locale";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: "admin" | "manager" | "collaborateur" | "client";
  userProfile?: "stagiaire" | "prestataire";
}

export function Sidebar({
  activeSection,
  onSectionChange,
  userRole,
  userProfile,
}: SidebarProps) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getMenuItems = () => {
    const baseItems = [
      { id: "documents", label: "Documents", icon: FileText },
      { id: "kpis", label: "KPIs", icon: BarChart3 },
    ];

    const adminItems = [
      { id: "agents", label: "Agents", icon: Users },
      { id: "contracts", label: "Contrats", icon: FileCheck },
      { id: "documents", label: "Documents", icon: File },
      { id: "factures", label: "Factures", icon: Receipt },
      { id: "kpis", label: "KPIs", icon: BarChart3 },
      { id: "absences", label: "Absences", icon: Calendar },
      { id: "videos", label: "Onboarding", icon: Video },
      { id: "taches", label: "Espace Personnel", icon: Calendar },
      {id: "espaces_des_agents", label: "Espaces Collaborateur", icon: Users},
      { id: "espaces_partages", label: "Espace Partagé", icon: Calendar},

      { id: "timer", label: "Timer", icon: Clock},
      { id: "rapports", label: "Rapports", icon: FileText },
      { id: "rapports_collabo", label: "Rapports Collaborateur", icon: FileText },
    ];

    const managerItems = [
      { id: "tableau_de_bord", label: "Tableau de bord", icon: FileText },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "factures", label: "Factures", icon: Receipt },
      { id: "kpis", label: "KPIs", icon: BarChart3 },
      { id: "absences", label: "Demande d'Absences", icon: Calendar },
      { id: "projets", label: "Projets", icon: FileText },
      { id: "taches", label: "Espace Personnel", icon: Calendar },
      {id: "espaces_des_agents", label: "Espaces Collaborateur", icon: Users},
      { id: "espaces_partages", label: "Espace Partagé", icon: Calendar},
      { id: "timer", label: "Timer", icon: Clock},
      { id: "rapports", label: "Rapports", icon: FileText },
      { id: "rapports_collabo", label: "Rapports Collaborateur", icon: FileText },  
      // { id: "certifications", label: "Certifications", icon: FileText },
      { id: "video", label: "Onboarding", icon: Video },
      // { id: "suivi_des_agents", label: "Suivi des Agents", icon: Calendar },
      // { id: "taches_en_retard", label: "Taches en Retard", icon: Calendar },
      // { id: "formations", label: "Formations", icon: Calendar },
    ];

    const collaborateurItems = [
      { id: "dashboard", label: "Dashboard", icon: FileText },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "factures", label: "Factures", icon: Receipt },
      { id: "kpis", label: "KPIs", icon: BarChart3 },
      { id: "absences", label: "Absences", icon: Calendar },

      { id: "taches", label: "Taches Personnelles", icon: Calendar },
      { id: "espaces_partages", label: "Espace Partagé", icon: Calendar},
      { id: "timer", label: "Timer", icon: Clock},
      { id: "rapports", label: "Rapports", icon: FileText },
      { id: "certifications", label: "Certifications", icon: FileText },
      { id: "video", label: "Onboarding", icon: Video },
    ];

    const clientItems = [{ id: "profil", label: "Profil", icon: User }];

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
    sous_titre = "ESPACE MANAGER"
  } else if (userRole === "admin") {
    sous_titre = "ESPACE ADMIN"
  } else if (userRole === "collaborateur") {
    sous_titre = "ESPACE AGENT"
  } else if (userRole === "client") {
    sous_titre = "ESPACE CLIENT"
  }

  const menuItems = getMenuItems();

  return (
    <>
      <div className="w-65 bg-[#1F2128] text-gray-300 flex flex-col h-screen border-r border-2 border-[#313442]">
        {/* Logo */}
        <div className="px-6 py-8 text-center">
          <img src="/images/logo3.png" className="w-20 mx-auto" />
          <p className="text-sm text-[#FFFFFF] mt-4 uppercase tracking-wide font-bold">
            {sous_titre}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition 
                ${
                  activeSection === item.id
                    ? "bg-[#6C4EA8] text-white shadow-md"
                    : "hover:bg-white/5 text-[#FFFFFF]"
                }
              `}
            >
              {item.icon ? <item.icon className="w-5 h-5" /> : null}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom settings / logout */}
        <div className="px-4 py-6 border-t border-gray-800">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#FFFFFF] hover:bg-white/5 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Modal logout (inchangé) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmer la déconnexion
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    authService.logout();
                    setShowLogoutConfirm(false);
                    router.push("/login");
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
