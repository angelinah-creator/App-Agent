import { api } from './api-config';

export interface KPI {
  _id: string;
  userId: string | {
    _id: string;
    nom: string;
    prenoms: string;
    email: string;
    profile: string;
  };
  type: 'rapport_mensuel';
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  periode: string;
  description?: string;
  createdAt: string;
}

export interface CreateKPIDto {
  type: 'rapport_mensuel';
  periode: string;
  description?: string;
}

export const kpiService = {
  async uploadKPI(file: File, createKPIDto: CreateKPIDto) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'rapport_mensuel'); // FORCÉ
    formData.append('periode', createKPIDto.periode);
    if (createKPIDto.description) {
      formData.append('description', createKPIDto.description);
    }

    const response = await api.post('/kpis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getUserKPIs() {
    const response = await api.get('/kpis/my-kpis');
    return response.data;
  },

  async deleteKPI(kpiId: string) {
    await api.delete(`/kpis/${kpiId}`);
  },

  async getKPIsStats() {
    const response = await api.get('/kpis/stats');
    return response.data;
  },

  async downloadKPI(kpiId: string): Promise<Blob> {
    const response = await api.get(`/kpis/download/${kpiId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};