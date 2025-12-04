import {
  IsString,
  IsEmail,
  MinLength,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsBoolean,
  ValidateIf,
  IsOptional,
} from 'class-validator';

export enum UserProfile {
  STAGIAIRE = 'stagiaire',
  PRESTATAIRE = 'prestataire',
}

export enum Genre {
  MASCULIN = 'Homme',
  FEMININ = 'Femme',
}

export enum Horaire {
  TEMPS_PLEIN = 'temps plein',
  TEMPS_PARTIEL = 'temps partiel',
}

export class RegisterDto {
  // Profile type
  @IsEnum(UserProfile)
  @IsNotEmpty()
  profile: UserProfile;

  // Champs communs
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenoms: string;

  @IsDateString()
  @IsNotEmpty()
  dateNaissance: Date;

  @IsEnum(Genre)
  @IsNotEmpty()
  genre: Genre;

  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsString()
  @IsNotEmpty()
  cin: string;

  @IsString()
  @IsNotEmpty()
  poste: string;

  @IsDateString()
  @IsNotEmpty()
  dateDebut: Date;

  @IsDateString()
  @IsOptional()
  dateFin?: Date;

  @IsBoolean()
  @IsNotEmpty()
  dateFinIndeterminee: boolean;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  // Champs spécifiques Stagiaire
  @ValidateIf((o) => o.profile === UserProfile.STAGIAIRE)
  @IsString()
  @IsNotEmpty()
  mission?: string;

  @ValidateIf((o) => o.profile === UserProfile.STAGIAIRE)
  @IsNumber()
  @IsNotEmpty()
  indemnite?: number;

  @ValidateIf((o) => o.profile === UserProfile.STAGIAIRE)
  @IsNumber()
  @IsNotEmpty()
  indemniteConnexion?: number;

  // Champs spécifiques Prestataire
  @ValidateIf((o) => o.profile === UserProfile.PRESTATAIRE)
  @IsString()
  @IsNotEmpty()
  domainePrestation?: string;

  @ValidateIf((o) => o.profile === UserProfile.PRESTATAIRE)
  @IsNumber()
  @IsNotEmpty()
  tarifJournalier?: number;

  @ValidateIf((o) => o.profile === UserProfile.PRESTATAIRE)
  @IsNumber()
  @IsNotEmpty()
  dureeJournaliere?: number;

  @ValidateIf((o) => o.profile === UserProfile.PRESTATAIRE)
  @IsNumber()
  @IsNotEmpty()
  tarifHoraire?: number;

  @ValidateIf((o) => o.profile === UserProfile.PRESTATAIRE)
  @IsNumber()
  @IsNotEmpty()
  nombreJour?: number;

  @ValidateIf((o) => o.profile === UserProfile.PRESTATAIRE)
  @IsNotEmpty()
  @IsEnum(Horaire)
  horaire?: string;
}
