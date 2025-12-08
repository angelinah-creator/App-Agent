// backend/src/users/dto/create-user.dto.ts
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
import { UserProfile, Genre } from '../schemas/user.schema'; // Utiliser les enums du schéma

export class CreateUserDto {
  @IsEnum(UserProfile)
  @IsNotEmpty()
  profile: UserProfile;

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

  @IsNumber()
  @IsNotEmpty()
  tjm: number;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

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
  horaire?: string;
}
