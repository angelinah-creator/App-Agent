import { IsString, IsNotEmpty, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateRendezVousDto {
  @IsString()
  @IsNotEmpty()
  lienCalendly: string;

  @IsString()
  @IsOptional()
  description?: string;
}