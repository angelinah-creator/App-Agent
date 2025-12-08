import { api } from './api-config';

export interface Nda {
  _id: string;
  userId: string;
  ndaNumber: string;
  pdfUrl: string;
  publicId: string;
  fileName: string;
  status: string;
  createdAt: string;
}

export const ndaService = {
  async generateNda(userId: string) {
    const response = await api.post(`/nda/generate/${userId}`);
    return response.data;
  },

  async getUserNda(userId: string) {
    const response = await api.get(`/nda/user/${userId}`);
    return response.data;
  },

  async getNda(ndaId: string) {
    const response = await api.get(`/nda/${ndaId}`);
    return response.data;
  },

  async deleteNda(ndaId: string) {
    await api.delete(`/nda/${ndaId}`);
  },

  async regenerateNda(userId: string) {
    const response = await api.put(`/nda/regenerate/${userId}`);
    return response.data;
  },

  async downloadNda(ndaId: string): Promise<Blob> {
    const response = await api.get(`/nda/download/${ndaId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};