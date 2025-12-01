import { api } from './api-config';

export interface Absence {
  _id: string;
  agentId: string | { _id: string; nom: string; prenoms: string; email: string };
  startDate: string;
  endDate: string;
  reason: string;
  backupPerson: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReason?: string;
  validatedBy?: string;
  validatedAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAbsenceDto {
  startDate: string;
  endDate: string;
  reason: string;
  backupPerson: string;
}

export interface UpdateAbsenceDto {
  status?: 'pending' | 'approved' | 'rejected';
  adminReason?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  backupPerson?: string;
}

class AbsenceService {
  async createAbsence(createAbsenceDto: CreateAbsenceDto): Promise<Absence> {
    const response = await api.post('/absences', createAbsenceDto);
    return response.data;
  }

  async getMyAbsences(): Promise<Absence[]> {
    const response = await api.get('/absences/my-absences');
    return response.data;
  }

  async getAllAbsences(): Promise<Absence[]> {
    const response = await api.get('/absences/all');
    return response.data;
  }

  async getPendingAbsences(): Promise<Absence[]> {
    const response = await api.get('/absences/pending');
    return response.data;
  }

  async updateAbsenceStatus(absenceId: string, updateAbsenceDto: UpdateAbsenceDto): Promise<Absence> {
    const response = await api.put(`/absences/${absenceId}/status`, updateAbsenceDto);
    return response.data;
  }

  async getAbsenceById(absenceId: string): Promise<Absence> {
    const response = await api.get(`/absences/${absenceId}`);
    return response.data;
  }

  async deleteAbsence(absenceId: string): Promise<void> {
    await api.delete(`/absences/${absenceId}`);
  }

  async getStats(): Promise<any> {
    const response = await api.get('/absences/stats');
    return response.data;
  }
}

export const absenceService = new AbsenceService();