// backend/src/projects/dto/create-project.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  start_time?: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  invitedManagers?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  invitedCollaborateurs?: string[];
}