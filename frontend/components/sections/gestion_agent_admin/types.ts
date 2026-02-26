import type { Agent, CreateAgentDto, Genre, UserProfile } from "@/lib/users-service";

export interface AgentsSectionProps {
  agents: Agent[];
  agentsLoading: boolean;
  stats?: any;
  onArchiveAgent: (agentId: string, archiveReason?: string) => void;
  onRestoreAgent: (agentId: string) => void;
  archiveAgentPending: boolean;
  onAgentCreated?: () => void;
  onAgentProfileChanged?: () => void;
  showArchived: boolean;
  onToggleArchived: (show: boolean) => void;
}

export type FilterProfileType = "all" | "stagiaire" | "prestataire";

export interface FormDataType extends CreateAgentDto {
  [key: string]: any;
}

export interface EditFormDataType {
  nom?: string;
  prenoms?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  poste?: string;
  dateDebut?: string;
  dateFin?: string | null;
  dateFinIndeterminee?: boolean;
  mission?: string;
  domainePrestation?: string;
  indemnite?: number;
  indemniteConnexion?: number;
  tjm?: number;
  tarifJournalier?: number;
  dureeJournaliere?: number;
  [key: string]: any;
}

export interface AvatarProps {
  agent: Agent;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  className?: string;
}

export interface PhotoUploadModalProps {
  agent: Agent;
  onClose: () => void;
  onSuccess: (updated: Agent) => void;
}

export interface PhotoLightboxProps {
  agent: Agent;
  onClose: () => void;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "outline" | "ghost" | "danger" | "orange" | "green" | "blue";
  size?: "sm" | "md";
}

export interface InputProps {
  id?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export interface FieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export interface ModalProps {
  onClose: () => void;
  header: React.ReactNode;
  headerClass?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}

export interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}