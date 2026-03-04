import { api } from '@/lib/api-config';

export interface RendezVousLink {
  _id: string;
  userId: string;
  nom: string;
  prenoms: string;
  role: 'admin' | 'manager';
  lienCalendly: string;
  description?: string;
  isActive: boolean;
  profilePhoto?: {
    url: string;
    publicId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRendezVousDto {
  lienCalendly: string;
  description?: string;
}

export interface UpdateRendezVousDto {
  lienCalendly?: string;
  description?: string;
  isActive?: boolean;
}

export const rendezVousService = {
  async getAllLinks(): Promise<RendezVousLink[]> {
    const response = await api.get('/rendez-vous');
    return response.data;
  },

  async getMyLink(): Promise<RendezVousLink | null> {
    const response = await api.get('/rendez-vous/me');
    return response.data;
  },

  async createLink(dto: CreateRendezVousDto): Promise<RendezVousLink> {
    const response = await api.post('/rendez-vous', dto);
    return response.data;
  },

  async updateLink(id: string, dto: UpdateRendezVousDto): Promise<RendezVousLink> {
    const response = await api.patch(`/rendez-vous/${id}`, dto);
    return response.data;
  },

  async deleteLink(id: string): Promise<void> {
    await api.delete(`/rendez-vous/${id}`);
  },
};