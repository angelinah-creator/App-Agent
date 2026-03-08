// backend/src/projects/dto/update-project.dto.ts
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

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