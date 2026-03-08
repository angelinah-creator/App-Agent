import { api } from '@/lib/api-config';

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  x?: string;
  whatsapp?: string;
  youtube?: string;
  github?: string;
  website?: string;
}

export interface RendezVousLink {
  _id: string;
  userId: string;
  nom: string;
  prenoms: string;
  role: 'admin' | 'manager' | 'collaborateur';
  lienCalendly: string;
  description?: string;
  isActive: boolean;
  socialLinks?: SocialLinks;
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
  socialLinks?: SocialLinks;
}

export interface UpdateRendezVousDto {
  lienCalendly?: string;
  description?: string;
  isActive?: boolean;
  socialLinks?: SocialLinks;
}

export const rendezVousService = {
  async getAllLinks(): Promise<RendezVousLink[]> {
    const response = await api.get('/rendez-vous');
    return response.data;
  },

  async getMyLink(): Promise<RendezVousLink | null> {
    try {
      const response = await api.get('/rendez-vous/me');
      return response.data;
    } catch {
      return null;
    }
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