import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  id_client?: string;

  @IsDateString()
  @IsOptional()
  start_time?: Date;

  @IsDateString()
  @IsOptional()
  end_time?: Date;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  agent_affectes?: string[];
}