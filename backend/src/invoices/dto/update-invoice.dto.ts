// backend/src/invoices/dto/update-invoice.dto.ts
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { InvoiceStatus } from '../schemas/invoice.schema';

export class UpdateInvoiceDto {
  @IsDateString()
  @IsOptional()
  paymentDate?: Date;

  @IsString()
  @IsOptional()
  transferReference?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}