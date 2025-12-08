export interface UserData {
  _id: string
  nom: string
  prenoms: string
  dateNaissance: string
  genre: string
  adresse: string
  cin: string
  poste: string
  profile: "stagiaire" | "prestataire" 
  telephone: string
  email: string
  dateDebut: string
  dateFin: string
  mission?: string
  indemnite?: number
  indemniteConnexion?: number
  domainePrestation?: string
  tarifJournalier?: number
  dureeJournaliere?: number
}

export interface CreateDocumentDto {
  type: "cin_recto" | "cin_verso" | "certificat_residence" | "diplome" | "cv" | "autre"
  description: string
}

export interface CreateFactureDto {
  montant: number
  dateFacture: string
  description?: string
}

export interface CreateKPIDto {
  type: "rapport_mensuel"
  periode: string
  description?: string
}

export interface Invoice {
  _id: string
  agentId: string
  month: number
  year: number
  reference: string
  pdfUrl: string
  fileName: string
  amount?: number
  paymentDate?: string
  transferReference?: string
  status: "pending" | "paid" | "unpaid"
  processedBy?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface KPI {
  _id: string;
  userId: string | {
    _id: string;
    nom: string;
    prenoms: string;
    email: string;
    profile: string;
  };
  fileName: string;
  fileSize: number;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  type: "rapport_mensuel"; // Uniquement rapport_mensuel
  periode: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}


export interface Absence {
  _id: string
  agentId: string | { _id: string; nom: string; prenoms: string; email: string }
  startDate: string
  endDate: string
  reason: string
  backupPerson: string
  status: "pending" | "approved" | "rejected"
  adminReason?: string
  validatedBy?: string
  validatedAt?: string
  duration?: number
  createdAt: string
  updatedAt: string
}

export interface CreateAbsenceDto {
  startDate: string
  endDate: string
  reason: string
  backupPerson: string
}

// Ajoutez ces interfaces dans votre fichier types.ts

export interface NotificationUser {
  _id: string;
  nom: string;
  prenoms: string;
  email: string;
  profile: string;
  telephone?: string;
}

export interface NotificationAbsence {
  _id: string;
  agentId: NotificationUser | string;
  startDate: string;
  endDate: string;
  reason: string;
  backupPerson: string;
  status: string;
  adminReason?: string;
  validatedBy?: NotificationUser | string;
  validatedAt?: string;
}

export interface NotificationInvoice {
  _id: string;
  agentId: NotificationUser | string;
  month: number;
  year: number;
  reference: string;
  status: string;
  amount?: number;
  paymentDate?: string;
  transferReference?: string;
  processedBy?: NotificationUser | string;
  processedAt?: string;
}

export interface Notification {
  _id: string;
  userId: NotificationUser | string;
  type:
    | "ABSENCE_CREATED"
    | "ABSENCE_APPROVED"
    | "ABSENCE_REJECTED"
    | "ABSENCE_PENDING"
    | "INVOICE_CREATED"
    | "INVOICE_PAID"
    | "INVOICE_OVERDUE"
    | "INVOICE_CANCELLED"
    | "SYSTEM"
    | "info"
    | "success"
    | "warning"
    | "error";
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  absenceId?: NotificationAbsence | string;
  invoiceId?: NotificationInvoice | string;
  createdAt: Date;
  updatedAt: Date;
}