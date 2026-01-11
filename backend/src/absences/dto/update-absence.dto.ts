// backend/src/absences/dto/update-absence.dto.ts
import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { AbsenceStatus } from '../schemas/absence.schema';

export class UpdateAbsenceDto {
  @IsEnum(AbsenceStatus)
  @IsOptional()
  status?: AbsenceStatus;

  @IsString()
  @IsOptional() // Rendre optionnel pour les approbations ET les rejets
  adminReason?: string;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  backupPerson?: string;
}