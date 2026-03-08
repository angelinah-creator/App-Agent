// frontend/lib/project-service.ts
import { api } from './api-config';

export interface ProjectMember {
  _id: string;
  nom: string;
  prenoms: string;
  email: string;
  role: string;
  profilePhoto?: { url: string; publicId: string };
}

export interface ProjectFile {
  url: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: ProjectMember;
  uploadedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  createdBy: ProjectMember;
  start_time?: string;
  end_time?: string;
  invitedManagers: ProjectMember[];
  invitedCollaborateurs: ProjectMember[];
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  invitedManagers?: string[];
  invitedCollaborateurs?: string[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  invitedManagers?: string[];
  invitedCollaborateurs?: string[];
}

export interface AvailableMembers {
  managers: import("@/lib/users-service").Agent[];
  collaborateurs: import("@/lib/users-service").Agent[];
}

export const projectService = {
  async create(data: CreateProjectDto): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async getAll(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data;
  },

  async getById(projectId: string): Promise<Project> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  async update(projectId: string, data: UpdateProjectDto): Promise<Project> {
    const response = await api.patch(`/projects/${projectId}`, data);
    return response.data;
  },

  async delete(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  },

  // NOUVELLE MÉTHODE
  async getUserProjects(userId: string): Promise<Project[]> {
    const response = await api.get(`/projects/user/${userId}`);
    return response.data;
  },

  async uploadFile(projectId: string, file: File): Promise<Project> {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/projects/${projectId}/files`,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de l\'upload du fichier');
    }

    return response.json();
  },

  async deleteFile(projectId: string, publicId: string): Promise<Project> {
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await api.delete(
      `/projects/${projectId}/files/${encodedPublicId}`,
    );
    return response.data;
  },

  async inviteManager(projectId: string, managerId: string): Promise<Project> {
    const response = await api.post(
      `/projects/${projectId}/invite-manager/${managerId}`,
    );
    return response.data;
  },

  async removeManager(projectId: string, managerId: string): Promise<Project> {
    const response = await api.delete(
      `/projects/${projectId}/remove-manager/${managerId}`,
    );
    return response.data;
  },

  async inviteCollaborateur(
    projectId: string,
    collaborateurId: string,
  ): Promise<Project> {
    const response = await api.post(
      `/projects/${projectId}/invite-collaborateur/${collaborateurId}`,
    );
    return response.data;
  },

  async getAvailableMembers(): Promise<AvailableMembers> {
    const response = await api.get('/projects/available-members');
    return response.data;
  },

  async removeCollaborateur(
    projectId: string,
    collaborateurId: string,
  ): Promise<Project> {
    const response = await api.delete(
      `/projects/${projectId}/remove-collaborateur/${collaborateurId}`,
    );
    return response.data;
  },
};