import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsMongoId,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { TimerStatus } from '../schemas/time-entry.schema';

export class CreateTimeEntryDto {
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsMongoId()
  personalTaskId?: string;

  @IsOptional()
  @IsMongoId()
  sharedTaskId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEnum(TimerStatus)
  status?: TimerStatus;

  @IsOptional()
  @IsBoolean()
  syncedFromOffline?: boolean;

  @IsOptional()
  @IsString()
  offlineId?: string;
}

export class UpdateTimeEntryDto {
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsMongoId()
  personalTaskId?: string;

  @IsOptional()
  @IsMongoId()
  sharedTaskId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEnum(TimerStatus)
  status?: TimerStatus;
}

export class StartTimerDto {
  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsMongoId()
  personalTaskId?: string;

  @IsOptional()
  @IsMongoId()
  sharedTaskId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SyncOfflineEntriesDto {
  @IsArray()
  entries: CreateTimeEntryDto[];
}

export class GetReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string; // Pour admin/manager
}