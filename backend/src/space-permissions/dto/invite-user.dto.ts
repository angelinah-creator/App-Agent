import { IsMongoId, IsEnum } from 'class-validator';
import { PermissionLevel } from '../schemas/space-permission.schema';

export class InviteUserDto {
  @IsMongoId()
  userId: string;

  @IsEnum(PermissionLevel)
  permissionLevel: PermissionLevel;
}