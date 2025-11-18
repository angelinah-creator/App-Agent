import { IsDateString, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAbsenceDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  backupPerson: string;
}