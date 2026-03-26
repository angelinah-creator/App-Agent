import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate une date (string ISO ou objet Date) au format YYYY-MM-DD pour les inputs HTML
 */
export function formatDateToInput(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";
    
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Erreur de formatage de date:", error);
    return "";
  }
}
