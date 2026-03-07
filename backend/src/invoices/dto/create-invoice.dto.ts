import { IsNumber, IsString, IsNotEmpty, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @IsNotEmpty()
  year: number;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}