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
  IsOptional
} from 'class-validator';
import { UserRole, UserProfile, Genre } from '../schemas/user.schema';

export class CreateUserDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsEnum(UserProfile)
  @IsNotEmpty()
  profile?: UserProfile;

  // Champs communs
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenoms: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  // Champs spécifiques aux collaborateurs et managers
  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsDateString()
  @IsNotEmpty()
  dateNaissance?: Date;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsEnum(Genre)
  @IsNotEmpty()
  genre?: Genre;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsString()
  @IsNotEmpty()
  adresse?: string;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsString()
  @IsNotEmpty()
  cin?: string;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsString()
  @IsNotEmpty()
  poste?: string;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsDateString()
  @IsNotEmpty()
  dateDebut?: Date;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsDateString()
  @IsOptional()
  dateFin?: Date;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsBoolean()
  @IsNotEmpty()
  dateFinIndeterminee?: boolean;

  @ValidateIf(o => o.role === UserRole.COLLABORATEUR || o.role === UserRole.MANAGER)
  @IsNumber()
  @IsNotEmpty()
  tjm?: number;

  // Champs spécifiques aux stagiaires
  @ValidateIf(o => o.profile === UserProfile.STAGIAIRE)
  @IsString()
  @IsNotEmpty()
  mission?: string;

  @ValidateIf(o => o.profile === UserProfile.STAGIAIRE)
  @IsNumber()
  @IsNotEmpty()
  indemnite?: number;

  @ValidateIf(o => o.profile === UserProfile.STAGIAIRE)
  @IsNumber()
  @IsNotEmpty()
  indemniteConnexion?: number;  

  // Champs spécifiques aux prestataires
  @ValidateIf(o => o.profile === UserProfile.PRESTATAIRE)
  @IsString()
  @IsNotEmpty()
  domainePrestation?: string;

  @ValidateIf(o => o.profile === UserProfile.PRESTATAIRE)
  @IsNumber()
  @IsNotEmpty()
  tarifJournalier?: number;

  @ValidateIf(o => o.profile === UserProfile.PRESTATAIRE)
  @IsNumber()
  @IsNotEmpty()
  dureeJournaliere?: number;

  // Champs spécifiques aux clients
  @ValidateIf(o => o.role === UserRole.CLIENT)
  @IsString()
  @IsOptional()
  entreprise?: string;

  @ValidateIf(o => o.role === UserRole.CLIENT)
  @IsString()
  @IsOptional()
  nif?: string;

  @ValidateIf(o => o.role === UserRole.CLIENT)
  @IsString()
  @IsOptional()
  stat?: string;

  @ValidateIf(o => o.role === UserRole.CLIENT)
  @IsString()
  @IsOptional()
  roleClient?: string;
}