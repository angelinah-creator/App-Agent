import { api } from "@/lib/api-config";

export interface Chapter {
  title: string;
  description?: string;
  startTime: number;
  endTime?: number;
}

export interface Video {
  _id: string;
  title: string;
  description?: string;
  url: string;
  duration: number;
  chapters: Chapter[];
  views: number;
  isActive: boolean;
  uploadedBy: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoData {
  title: string;
  description?: string;
  chapters?: Chapter[];
}

export interface UpdateVideoData {
  title?: string;
  description?: string;
  isActive?: boolean;
  chapters?: Chapter[];
}

class VideoService {
  // Récupérer la vidéo (unique)
  async getActiveVideo(): Promise<Video | null> {
    try {
      const response = await api.get('/videos');
      // Si le backend retourne un message "Aucune vidéo disponible"
      if (response.data.message) {
        return null;
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Uploader une vidéo (remplace l'ancienne si elle existe)
  async uploadVideo(formData: FormData): Promise<Video> {
    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Mettre à jour une vidéo (titre, description, chapitres)
  async updateVideo(id: string, data: UpdateVideoData): Promise<Video> {
    const response = await api.put(`/videos/${id}`, data);
    return response.data;
  }

  // Supprimer la vidéo
  async deleteVideo(id: string): Promise<void> {
    await api.delete(`/videos/${id}`);
  }

}

export const videoService = new VideoService();
