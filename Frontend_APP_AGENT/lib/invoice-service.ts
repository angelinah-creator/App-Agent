// frontend/lib/invoice-service.ts
import { api } from './api-config';

export interface Invoice {
  _id: string;
  agentId: string;
  month: number;
  year: number;
  reference: string;
  pdfUrl: string;
  fileName: string;
  amount?: number;
  paymentDate?: string;
  transferReference?: string;
  status: 'pending' | 'paid' | 'unpaid';
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  month: number;
  year: number;
  reference: string;
}

export interface UpdateInvoiceDto {
  amount?: number;
  paymentDate?: string;
  transferReference?: string;
  status?: 'pending' | 'paid' | 'unpaid';
}

class InvoiceService {
  async createInvoice(createInvoiceDto: CreateInvoiceDto, file: File): Promise<Invoice> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', createInvoiceDto.month.toString());
    formData.append('year', createInvoiceDto.year.toString());
    formData.append('reference', createInvoiceDto.reference);

    const response = await api.post('/invoices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getMyInvoices(): Promise<Invoice[]> {
    const response = await api.get('/invoices/my-invoices');
    return response.data;
  }

  async getAllInvoices(): Promise<Invoice[]> {
    const response = await api.get('/invoices/all');
    return response.data;
  }

  async getAgentInvoices(agentId: string): Promise<Invoice[]> {
    const response = await api.get(`/invoices/agent/${agentId}`);
    return response.data;
  }

  async updateInvoice(invoiceId: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const response = await api.put(`/invoices/${invoiceId}`, updateInvoiceDto);
    return response.data;
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data;
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    await api.delete(`/invoices/${invoiceId}`);
  }

  async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      // Récupérer d'abord les informations de la facture pour avoir le nom du fichier
      const invoice = await this.getInvoice(invoiceId);
      
      // Télécharger le fichier
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/invoices/download/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      // Créer le blob avec le bon type MIME
      const blob = await response.blob();
      
      // Vérifier que c'est bien un PDF
      if (blob.type !== 'application/pdf') {
        console.warn('Le type MIME n\'est pas PDF, forçage du type...');
      }

      // Créer un blob PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      
      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      
      // Utiliser le nom de fichier de l'invoice ou générer un nom basé sur la référence
      const fileName = invoice.fileName || `facture_${invoice.reference}.pdf`;
      link.download = fileName;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  // Alternative: Téléchargement direct via l'URL Cloudinary
  async downloadInvoiceDirect(invoice: Invoice): Promise<void> {
    try {
      // Ouvrir directement l'URL Cloudinary dans un nouvel onglet
      window.open(invoice.pdfUrl, '_blank');
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la facture:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();