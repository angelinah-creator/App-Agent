// backend/src/users/dto/create-client.dto.ts
import { 
  IsString, 
  IsEmail, 
  MinLength, 
  IsNotEmpty, 
  IsOptional
} from 'class-validator';

export class CreateClientDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  prenoms?: string;

  @IsString()
  @IsOptional()
  entreprise?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsString()
  @IsOptional()
  stat?: string;

  @IsString()
  @IsOptional()
  roleClient?: string;
}