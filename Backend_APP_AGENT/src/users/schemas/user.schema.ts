import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserProfile {
  STAGIAIRE = 'stagiaire',
  PRESTATAIRE = 'prestataire',
  ADMIN = 'admin',
}

export enum Genre {
  MASCULIN = 'Homme',
  FEMININ = 'Femme',
}

@Schema({ 
  timestamps: true, 
  discriminatorKey: 'profile',
  collection: 'users' // Force la collection à 'users'
})
export class User {
  @Prop({ 
    required: true, 
    enum: UserProfile,
    type: String 
  })
  profile: UserProfile;

  // Champs communs
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenoms: string;

  @Prop({ required: true })
  dateNaissance: Date;

  @Prop({ required: true, enum: Genre })
  genre: Genre;

  @Prop({ required: true })
  adresse: string;

  @Prop({ required: true, unique: true })
  cin: string;

  @Prop({ required: true })
  poste: string;

  @Prop({ required: true })
  dateDebut: Date;

  @Prop()
  dateFin?: Date;

  @Prop({ default: false })
  dateFinIndeterminee: boolean;

  @Prop({ required: true })
  tjm: number;

  @Prop({ required: true })
  telephone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: false })
  archived: boolean;

  @Prop()
  archivedAt?: Date;

  @Prop()
  archiveReason?: string;

  // Champs optionnels pour les deux profils
  @Prop()
  mission?: string;

  @Prop()
  indemnite?: number;

  @Prop()
  indemniteConnexion?: number;

  @Prop()
  domainePrestation?: string;

  @Prop()
  tarifJournalier?: number;

  @Prop()
  dureeJournaliere?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);