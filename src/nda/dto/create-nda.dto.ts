import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNdaDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class RegenerateNdaDto {
  @IsString()
  @IsOptional()
  reason?: string;
}