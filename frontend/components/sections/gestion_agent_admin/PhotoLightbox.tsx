"use client";

import type React from "react";
import { X } from "lucide-react";
import type { Agent } from "@/lib/users-service";
import type { PhotoLightboxProps } from "./types";

export function PhotoLightbox({ agent, onClose }: PhotoLightboxProps) {
  const photoUrl = (agent as any).profilePhoto?.url;
  if (!photoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <img
            src={photoUrl}
            alt={`${agent.prenoms} ${agent.nom}`}
            className="w-full h-auto max-h-[80vh] object-contain bg-[#0d0e13]"
          />
        </div>
        <p className="text-center text-white/70 text-sm mt-3 font-medium">
          {agent.prenoms} {agent.nom}
        </p>
      </div>
    </div>
  );
}