// backend/src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  COLLABORATEUR = 'collaborateur',
  MANAGER = 'manager',
  CLIENT = 'client',
}

export enum UserProfile {
  STAGIAIRE = 'stagiaire',
  PRESTATAIRE = 'prestataire',
}

export enum Genre {
  MASCULIN = 'Homme',
  FEMININ = 'Femme',
}

@Schema({ 
  timestamps: true, 
  collection: 'users'
})
export class User {
  @Prop({ 
    required: true, 
    enum: UserRole,
    type: String,
    default: UserRole.CLIENT
  })
  role: UserRole;

  @Prop({ 
    enum: UserProfile,
    type: String 
  })
  profile?: UserProfile; // Optionnel maintenant

  // Champs communs pour tous les utilisateurs
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenoms: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  telephone: string;

  @Prop({ default: false })
  archived: boolean;

  @Prop()
  archivedAt?: Date;

  @Prop()
  archiveReason?: string;

  // Champs spécifiques aux collaborateurs et managers (stagiaire/prestataire)
  @Prop()
  dateNaissance?: Date;

  @Prop({ enum: Genre })
  genre?: Genre;

  @Prop()
  adresse?: string;

  @Prop({ unique: true, sparse: true })
  cin?: string;

  @Prop()
  poste?: string;

  @Prop()
  dateDebut?: Date;

  @Prop()
  dateFin?: Date;

  @Prop({ default: false })
  dateFinIndeterminee?: boolean;

  @Prop()
  tjm?: number;

  // Champs spécifiques aux stagiaires
  @Prop()
  mission?: string;

  @Prop()
  indemnite?: number;

  @Prop()
  indemniteConnexion?: number;

  // Champs spécifiques aux prestataires
  @Prop()
  domainePrestation?: string;

  @Prop()
  tarifJournalier?: number;

  @Prop()
  dureeJournaliere?: number;

  // Champs spécifiques aux clients
  @Prop()
  entreprise?: string;

  @Prop()
  nif?: string;

  @Prop()
  stat?: string;

  @Prop()
  roleClient?: string;

  @Prop({ default: false })
  completedProfile?: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);