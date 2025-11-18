import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserProfile } from '../schemas/user.schema'; // Utiliser le même enum

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsEnum(UserProfile)
  @IsOptional()
  profile?: UserProfile;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}