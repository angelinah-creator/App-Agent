import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsArray, IsMongoId } from 'class-validator';
import { TaskPriority, TaskStatus } from '../schemas/shared-task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  start_date?: Date;

  @IsDateString()
  @IsOptional()
  end_date?: Date;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  assignees?: string[];

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsMongoId()
  @IsOptional()
  project_id?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  sub_tasks?: string[];
}