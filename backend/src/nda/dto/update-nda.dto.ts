// backend/src/ndas/dto/update-nda.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateNdaDto } from './create-nda.dto';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { NdaStatus } from '../schemas/nda.schema';

export class UpdateNdaDto extends PartialType(CreateNdaDto) {
  @IsEnum(NdaStatus)
  @IsOptional()
  status?: NdaStatus;

  @IsDateString()
  @IsOptional()
  signedAt?: Date;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsDateString()
  @IsOptional()
  archivedAt?: Date;

  @IsNumber()
  @IsOptional()
  version?: number;
}