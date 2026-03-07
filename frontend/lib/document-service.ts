import { api } from './api-config';

export interface Document {
  createElement(arg0: string): unknown;
  _id: string;
  userId: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  description?: string;
  createdAt: string;
}

export interface CreateDocumentDto {
  description?: string;
}

export const documentService = {
  async uploadDocument(file: File, createDocumentDto: CreateDocumentDto) {
    const formData = new FormData();
    formData.append('file', file);
    if (createDocumentDto.description) {
      formData.append('description', createDocumentDto.description);
    }

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getUserDocuments() {
    const response = await api.get('/documents/my-documents');
    return response.data;
  },

  async deleteDocument(documentId: string) {
    await api.delete(`/documents/${documentId}`);
  },

  async getDocumentsStats() {
    const response = await api.get('/documents/stats');
    return response.data;
  },

  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await api.get(`/documents/download/${documentId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};