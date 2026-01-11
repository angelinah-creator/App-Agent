import { api } from './api-config';
import { Task, TaskPriority, TaskStatus } from './task-service';

export interface AdminTaskFilters {
  project_id?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string;
  end_date?: string;
}

export const taskAdminService = {
  // Récupérer les tâches d'un utilisateur spécifique (pour admin/manager)
  async getUserTasks(userId: string, filters?: AdminTaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    
    // ✅ S'assurer que les valeurs ne sont pas undefined
    if (filters?.project_id) params.append('project_id', filters.project_id);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const url = `/personal/tasks/admin/user/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('URL appelée:', url); // Pour débogage
    
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Erreur récupération tâches:', error.response?.data || error.message);
      throw error;
    }
  },

  // Récupérer les sous-tâches d'un utilisateur (pour admin/manager)
  async getSubtasks(taskId: string): Promise<Task[]> {
    try {
      const response = await api.get(`/personal/tasks/admin/${taskId}/subtasks`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur récupération sous-tâches:', error.response?.data || error.message);
      throw error;
    }
  },
};