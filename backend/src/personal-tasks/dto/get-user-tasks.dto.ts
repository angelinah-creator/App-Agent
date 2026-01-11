import { IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { TaskPriority, TaskStatus } from '../schemas/personal-task.schema';

export class GetUserTasksDto {
  @IsOptional()
  @IsMongoId()
  project_id?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  start_date?: string;

  @IsOptional()
  end_date?: string;
}