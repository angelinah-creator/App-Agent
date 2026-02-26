// frontend/lib/nda-service.ts
import { api } from "./api-config";

export interface Nda {
  _id: string;
  userId: string;
  ndaNumber: string;
  pdfUrl: string;
  fileName: string;
  status: "generated" | "signed" | "cancelled" | "expired";
  signedAt?: string;
  expiresAt?: string;
  isArchived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface NdaStats {
  total: number;
  generated: number;
  signed: number;
  archived: number;
  expired: number;
  byMonth: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
}

export const ndaService = {
  /**
   * Générer un NDA pour un utilisateur
   */
  async generateNda(userId: string): Promise<Nda> {
    const response = await api.post(`/ndas/generate/${userId}`);
    return response.data;
  },

  /**
   * Récupérer tous les NDAs (admin seulement)
   */
  async getAllNdas(options?: {
    includeArchived?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<Nda[]> {
    const params = new URLSearchParams();
    if (options?.includeArchived) params.append("includeArchived", "true");
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.skip) params.append("skip", options.skip.toString());

    const queryString = params.toString();
    const url = queryString ? `/ndas?${queryString}` : "/ndas";

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Récupérer les NDAs de l'utilisateur connecté
   */
  async getUserNdas(userId: string): Promise<Nda[]> {
    const response = await api.get(`/ndas/user/${userId}`);
    return response.data;
  },

  /**
   * Récupérer un NDA par son ID
   */
  async getNdaById(ndaId: string): Promise<Nda> {
    const response = await api.get(`/ndas/${ndaId}`);
    return response.data;
  },

  /**
   * Régénérer un NDA
   */
  async regenerateNda(ndaId: string): Promise<Nda> {
    const response = await api.put(`/ndas/regenerate/${ndaId}`);
    return response.data;
  },

  /**
   * Marquer un NDA comme signé
   */
  async markAsSigned(ndaId: string): Promise<Nda> {
    const response = await api.put(`/ndas/${ndaId}/sign`);
    return response.data;
  },

  /**
   * Supprimer un NDA (admin seulement)
   */
  async deleteNda(ndaId: string): Promise<void> {
    await api.delete(`/ndas/${ndaId}`);
  },

  /**
   * Archiver un NDA (admin seulement)
   */
  async archiveNda(ndaId: string): Promise<Nda> {
    const response = await api.put(`/ndas/${ndaId}/archive`);
    return response.data;
  },

  /**
   * Restaurer un NDA archivé (admin seulement)
   */
  async restoreNda(ndaId: string): Promise<Nda> {
    const response = await api.put(`/ndas/${ndaId}/restore`);
    return response.data;
  },

  /**
   * Récupérer les statistiques des NDAs (admin seulement)
   */
  async getNdaStats(): Promise<NdaStats> {
    const response = await api.get("/ndas/stats/all");
    return response.data;
  },

  /**
   * Télécharger un NDA
   */
  async downloadNda(ndaId: string): Promise<void> {
    try {
      // Méthode avec blob
      const nda = await this.getNdaById(ndaId);

      const response = await fetch(nda.pdfUrl);
      if (!response.ok) throw new Error("Erreur de téléchargement");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nda.fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erreur téléchargement NDA:", error);
      throw error;
    }
  },
};
