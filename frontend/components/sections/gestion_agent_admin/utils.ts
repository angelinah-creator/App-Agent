import type { Agent } from "@/lib/users-service";

// Constantes en dur
const AVATAR_COLORS = [
  "#7C3AED", "#2563EB", "#059669", "#D97706",
  "#DC2626", "#7C3AED", "#0891B2", "#65A30D",
];

export function getInitials(agent: Agent): string {
  const p = (agent.prenoms || "").trim()[0] || "";
  const n = (agent.nom || "").trim()[0] || "";
  return (p + n).toUpperCase() || "?";
}

export function getAvatarColor(agent: Agent): string {
  const idx = (agent._id || "").charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("fr-FR");
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("fr-FR");
}