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

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  return (
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
        <div className="p-6 border-b border-slate-700/50 mx-auto">
          {/* <h1
            className={`text-2xl font-bold bg-clip-text text-transparent ${
              isAdmin
                ? "bg-gradient-to-r from-white to-violet-200"
                : "bg-gradient-to-r from-white to-blue-200"
            }`}
          >
            CODE TALENT
          </h1> */}
          <div className="w-20">
            <img src="/Logo.png" alt="" />
          </div>
          <p
            className={`text-lg mt-1 text-center -ml-4 uppercase font-bold ${
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white hover:scale-102e transition-all duration-300 hover:scale-102"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}