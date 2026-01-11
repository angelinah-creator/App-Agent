// lib/project-service.ts
import { api } from './api-config';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  id_client: {
    _id: string;
    entreprise?: string;
    nom: string;
    prenoms: string;
    email: string;
  };
  start_time?: string;
  end_time?: string;
  agent_affectes: Array<{
    _id: string;
    nom: string;
    prenoms: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  id_client: string;
  start_time?: string;
  end_time?: string;
  agent_affectes: string[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  id_client?: string;
  start_time?: string;
  end_time?: string;
  agent_affectes?: string[];
}

export const projectService = {
  // Créer un projet
  async create(data: CreateProjectDto): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  // Récupérer tous les projets
  async getAll(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data;
  },

  // Récupérer un projet par ID
  async getById(projectId: string): Promise<Project> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  // Mettre à jour un projet
  async update(projectId: string, data: UpdateProjectDto): Promise<Project> {
    const response = await api.patch(`/projects/${projectId}`, data);
    return response.data;
  },

  // Supprimer un projet
  async delete(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  }
};