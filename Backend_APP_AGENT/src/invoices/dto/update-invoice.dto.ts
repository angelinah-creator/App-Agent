// backend/src/invoices/dto/update-invoice.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { IsNumber, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { InvoiceStatus } from '../schemas/invoice.schema';
import { Type } from 'class-transformer';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  paymentDate?: Date;

  @IsString()
  @IsOptional()
  transferReference?: string; // NOUVEAU

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}