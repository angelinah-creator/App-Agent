import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional, IsBoolean, IsDate, IsString, IsObject } from 'class-validator';
import { UserProfile } from '../schemas/user.schema'; 

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsEnum(UserProfile)
  @IsOptional()
  profile?: UserProfile;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @IsDate()
  @IsOptional()
  archivedAt?: Date;

  @IsString()
  @IsOptional()
  archiveReason?: string;

  @IsOptional()
  @IsObject()
  profilePhoto?: {
    url: string;
    publicId: string;
  };

  @IsOptional()
  profilePhotoFile?: any; // Pour l'upload via FormData
}