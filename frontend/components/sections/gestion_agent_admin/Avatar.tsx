"use client";

import type React from "react";
import { Archive } from "lucide-react";
import type { Agent } from "@/lib/users-service";
import type { AvatarProps } from "./types";
import { getInitials, getAvatarColor } from "./utils";

// Constantes en dur
const AVATAR_SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl"
};

export function Avatar({
  agent,
  size = "md",
  onClick,
  className = "",
}: AvatarProps) {
  const photoUrl = (agent as any).profilePhoto?.url;

  return (
    <div
      className={`relative flex-shrink-0 rounded-full overflow-hidden ${AVATAR_SIZES[size]} ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className}`}
      onClick={onClick}
      style={{ backgroundColor: photoUrl ? undefined : getAvatarColor(agent) }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={`${agent.prenoms} ${agent.nom}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-white bg-[#6C4EA8]">
          {getInitials(agent)}
        </div>
      )}
      {agent.archived && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Archive size={size === "sm" ? 10 : size === "md" ? 13 : 20} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}