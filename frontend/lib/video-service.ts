import { api } from '@/lib/api-config';

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
  // Récupérer la vidéo active
  async getActiveVideo(): Promise<Video> {
    const response = await api.get('/videos/active/video');
    return response.data;
  }

  // Récupérer toutes les vidéos (pour admin/manager)
  async getAllVideos(page: number = 1, limit: number = 10, active?: boolean) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (active !== undefined) {
      params.append('active', active.toString());
    }

    const response = await api.get(`/videos?${params}`);
    return response.data;
  }

  // Uploader une vidéo
  async uploadVideo(formData: FormData): Promise<Video> {
    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Mettre à jour une vidéo
  async updateVideo(id: string, data: UpdateVideoData): Promise<Video> {
    const response = await api.put(`/videos/${id}`, data);
    return response.data;
  }

  // Supprimer une vidéo
  async deleteVideo(id: string): Promise<void> {
    await api.delete(`/videos/${id}`);
  }

  // Récupérer une vidéo par ID
  async getVideoById(id: string): Promise<Video> {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  }

  // Récupérer la miniature
  async getThumbnail(id: string): Promise<string> {
    const response = await api.get(`/videos/${id}/thumbnail`);
    return response.data.thumbnailUrl;
  }
}

export const videoService = new VideoService();