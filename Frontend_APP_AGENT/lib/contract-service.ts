import { api } from './api-config';

export interface Contract {
  _id: string;
  userId: string;
  type: 'stagiaire' | 'prestataire';
  contractNumber: string;
  pdfUrl: string;
  fileName: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
}

export const contractService = {
  async generateContract(userId: string) {
    const response = await api.post(`/contracts/generate/${userId}`);
    return response.data;
  },

  async getUserContracts(userId: string) {
    const response = await api.get(`/contracts/user/${userId}`);
    return response.data;
  },

  async getContract(contractId: string) {
    const response = await api.get(`/contracts/${contractId}`);
    return response.data;
  },

  async deleteContract(contractId: string) {
    await api.delete(`/contracts/${contractId}`);
  },

  async regenerateContract(contractId: string) {
    const response = await api.put(`/contracts/regenerate/${contractId}`);
    return response.data;
  },

  async downloadContract(contractId: string): Promise<Blob> {
    const response = await api.get(`/contracts/download/${contractId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};