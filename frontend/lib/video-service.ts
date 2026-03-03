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
  publicId: string;
  duration: number;
  format?: string;
  size?: number;
  chapters: Chapter[];
  views: number;
  isActive: boolean;
  uploadedBy: {
    _id: string;
    username?: string;
    email: string;
    nom?: string;
    prenoms?: string;
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
  async getVideos(): Promise<Video[]> {
    const response = await api.get('/videos');
    return response.data;
  }

  async getVideosAdmin(): Promise<Video[]> {
    const response = await api.get('/videos/admin');
    return response.data;
  }

  async getVideo(id: string): Promise<Video> {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  }

  async uploadVideo(formData: FormData): Promise<Video> {
    const response = await api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async updateVideo(id: string, data: UpdateVideoData): Promise<Video> {
    const response = await api.put(`/videos/${id}`, data);
    return response.data;
  }

  async deleteVideo(id: string): Promise<void> {
    await api.delete(`/videos/${id}`);
  }

  async incrementViews(id: string): Promise<void> {
    await api.patch(`/videos/${id}/view`);
  }
}

export const videoService = new VideoService();