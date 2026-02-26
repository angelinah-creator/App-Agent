"use client";

import type React from "react";
import type { Agent } from "@/lib/users-service";

export function ProfileBadge({ agent }: { agent: Agent }) {
  if (agent.archived) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-700/50 text-gray-400 border border-gray-600/30 capitalize">
        {agent.profile} · archivé
      </span>
    );
  }
  
  if (agent.profile === "stagiaire") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
        Stagiaire
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
      Prestataire
    </span>
  );
}