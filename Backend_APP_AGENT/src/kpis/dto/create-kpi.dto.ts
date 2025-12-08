import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { KPIType } from '../schemas/kpis.schema';

export class CreateKPIDto {
  @IsEnum(KPIType)
  @IsNotEmpty()
  type: KPIType;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'La période doit être au format YYYY-MM (ex: 2025-01)'
  })
  periode: string;

  @IsString()
  @IsOptional()
  description?: string;
}