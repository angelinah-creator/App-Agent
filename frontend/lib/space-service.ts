// lib/space-service.ts
import { api } from './api-config';

export interface SpacePhoto {
  url: string;
  publicId: string;
}

export interface Space {
  isPublic: any;
  _id: string;
  name: string;
  description?: string;
  createdBy: {
    _id: string;
    nom: string;
    prenoms: string;
    email: string;
  };
  isActive: boolean;
  photo?: SpacePhoto;
  createdAt: string;
  updatedAt: string;
}

export interface SpacePermission {
  _id: string;
  spaceId: Space;
  userId: {
    _id: string;
    nom: string;
    prenoms: string;
    email: string;
    role: string;
  };
  permissionLevel: 'viewer' | 'editor' | 'super_editor';
}

export interface CreateSpaceDto {
  name: string;
  description?: string;
  photo?: SpacePhoto;
}

export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  photo?: SpacePhoto;
}

export const spaceService = {
  // Créer un espace
  async create(data: CreateSpaceDto): Promise<Space> {
    const response = await api.post('/shared/spaces', data);
    return response.data;
  },

  // Uploader une photo
  async uploadPhoto(file: File, spaceName: string): Promise<SpacePhoto> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('spaceName', spaceName);

    const response = await api.post('/shared/spaces/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Récupérer tous les espaces (admin)
  async getAll(filters?: { isActive?: boolean; search?: string }): Promise<Space[]> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);

    const url = `/shared/spaces/admin/all${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Récupérer mes espaces
  async getMySpaces(): Promise<Space[]> {
    const response = await api.get('/shared/spaces/my-spaces');
    return response.data;
  },

  // Récupérer un espace par ID
  async getById(spaceId: string): Promise<Space> {
    const response = await api.get(`/shared/spaces/${spaceId}`);
    return response.data;
  },

  // Mettre à jour un espace
  async update(spaceId: string, data: UpdateSpaceDto): Promise<Space> {
    const response = await api.put(`/shared/spaces/${spaceId}`, data);
    return response.data;
  },

  // Supprimer un espace
  async delete(spaceId: string): Promise<void> {
    await api.delete(`/shared/spaces/${spaceId}`);
  },

  // Permissions
  async getPermissions(spaceId: string): Promise<SpacePermission[]> {
    const response = await api.get(`/shared/spaces/${spaceId}/permissions`);
    return response.data;
  },

  async inviteUser(spaceId: string, userId: string, permissionLevel: string): Promise<SpacePermission> {
    const response = await api.post(`/shared/spaces/${spaceId}/permissions/invite`, {
      userId,
      permissionLevel
    });
    return response.data;
  },

  async updatePermission(spaceId: string, userId: string, permissionLevel: string): Promise<SpacePermission> {
    const response = await api.put(`/shared/spaces/${spaceId}/permissions/users/${userId}`, {
      permissionLevel
    });
    return response.data;
  },

  async removeUser(spaceId: string, userId: string): Promise<void> {
    await api.delete(`/shared/spaces/${spaceId}/permissions/users/${userId}`);
  },

  async getMyPermissions(): Promise<SpacePermission[]> {
    const response = await api.get('/shared/spaces/:spaceId/permissions/my-permissions');
    return response.data;
  }
};