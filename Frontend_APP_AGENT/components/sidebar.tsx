// frontend/components/sidebar.tsx
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
} from "lucide-react";
import { authService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userProfile: "stagiaire" | "prestataire" | "admin";
}

export function Sidebar({
  activeSection,
  onSectionChange,
  userProfile,
}: SidebarProps) {
  const router = useRouter();
  const isAdmin = userProfile === "admin";
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const adminMenuItems = [
    { id: "agents", label: "Agents", icon: Users },
    { id: "contracts", label: "Contrats", icon: FileCheck },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "factures", label: "Factures", icon: Receipt },
    { id: "kpis", label: "KPIs", icon: BarChart3 },
    { id: "absences", label: "Absences", icon: Calendar },
  ];

  const agentMenuItems = [
    { id: "documents", label: "Documents", icon: FileText },
    { id: "factures", label: "Factures", icon: Receipt },
    { id: "kpis", label: "KPIs", icon: BarChart3 },
    { id: "absences", label: "Absences", icon: Calendar },
    { id: "profil", label: "Profil", icon: User },
  ];

  const menuItems = isAdmin ? adminMenuItems : agentMenuItems;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    authService.logout();
    setShowLogoutConfirm(false);
    router.push("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <div
        className={`w-64 text-white flex flex-col shadow-2xl relative h-screen ${
          isAdmin
            ? "bg-gradient-to-b from-violet-900 via-purple-900 to-fuchsia-900"
            : "bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900"
        }`}
      >
        <div
          className={`absolute inset-0 pointer-events-none ${
            isAdmin
              ? "bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10"
              : "bg-gradient-to-br from-blue-600/10 to-indigo-600/10"
          }`}
        ></div>
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50 text-center">
            <div className="w-20 mx-auto">
              <img src="/Logo.png" alt="Logo" />
            </div>
            <p
              className={`text-lg mt-2 uppercase font-bold ${
                isAdmin ? "text-violet-200" : "text-blue-200"
              }`}
            >
              {isAdmin ? "Administration" : "Espace Agent"}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300 ${
                  activeSection === item.id
                    ? isAdmin
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 scale-105"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "text-slate-300 hover:bg-white/10 hover:text-white hover:scale-102"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-700/50 mt-auto">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white hover:scale-102 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de déconnexion */}
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
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmLogout}
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