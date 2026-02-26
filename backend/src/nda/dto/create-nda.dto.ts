// backend/src/nda/dto/create-nda.dto.ts
import { IsString, IsEnum, IsOptional, IsDate } from 'class-validator';
import { NdaStatus } from '../schemas/nda.schema';
import { Types } from 'mongoose';

export class CreateNdaDto {
  @IsString()
  userId: string; // On accepte string dans le DTO

  @IsString()
  ndaNumber: string;

  @IsString()
  pdfUrl: string;

  @IsString()
  publicId: string;

  @IsString()
  fileName: string;

  @IsEnum(NdaStatus)
  status: NdaStatus;

  @IsOptional()
  @IsDate()
  expiresAt?: Date;
}