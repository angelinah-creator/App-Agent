import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  id_client: string;

  @IsDateString()
  @IsOptional()
  start_time?: Date;

  @IsDateString()
  @IsOptional()
  end_time?: Date;

  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  agent_affectes: string[];
}
