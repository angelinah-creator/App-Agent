import { IsEnum } from 'class-validator';
import { PermissionLevel } from '../schemas/space-permission.schema';

export class UpdatePermissionDto {
  @IsEnum(PermissionLevel)
  permissionLevel: PermissionLevel;
}