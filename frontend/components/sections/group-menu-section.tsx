// frontend/components/sections/group-menu-section.tsx
"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

export interface GroupMenuItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface GroupMenuSectionProps {
  title: string;
  subtitle?: string;
  items: GroupMenuItem[];
  onSelect: (sectionId: string) => void;
  onBack?: () => void;
}

export function GroupMenuSection({
  title,
  subtitle,
  items,
  onSelect,
  onBack,
}: GroupMenuSectionProps) {
  return (
    <div className="space-y-6 -mt-2 sm:-mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1F2128] border border-[#313442] px-3 py-2 rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour
          </button>
        )}
        <div>
          <h1 className="text-white font-extrabold text-xl sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Grille de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="group relative flex flex-col items-start gap-4 p-5 rounded-xl bg-[#1F2128] border border-[#313442] hover:border-[#6C4EA8]/60 transition-all duration-200 hover:shadow-lg hover:shadow-[#6C4EA8]/10 text-left cursor-pointer overflow-hidden"
            >
              {/* Accent gradient sur hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6C4EA8]/0 to-[#6C4EA8]/0 group-hover:from-[#6C4EA8]/5 group-hover:to-transparent transition-all duration-300 rounded-xl" />

              {/* Icône */}
              <div className="relative z-10 p-3 rounded-xl bg-violet-500/15 transition-transform duration-200 group-hover:scale-110">
                <Icon className="w-6 h-6 text-violet-400" />
              </div>

              {/* Texte */}
              <div className="relative z-10 flex-1">
                <h3 className="font-semibold text-white text-base group-hover:text-violet-300 transition-colors duration-200">
                  {item.label}
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Flèche subtile */}
              <div className="relative z-10 self-end">
                <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-violet-400 rotate-180 transition-all duration-200 group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
