import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SpacePermissionsService } from './space-permissions.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SpacePermissionGuard } from './guards/space-permission.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('shared/spaces/:spaceId/permissions')
@UseGuards(JwtAuthGuard, SpacePermissionGuard)
export class SpacePermissionsController {
  constructor(private readonly spacePermissionsService: SpacePermissionsService) {}

  @Post('invite')
  async inviteUser(
    @Param('spaceId') spaceId: string,
    @Body() inviteUserDto: InviteUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Les admins et managers peuvent toujours inviter
    return this.spacePermissionsService.inviteUserToSpace(spaceId, inviteUserDto, req.user.userId, req.user.role);
  }

  @Get()
  getSpacePermissions(@Param('spaceId') spaceId: string) {
    return this.spacePermissionsService.getSpacePermissions(spaceId);
  }

  @Put('users/:userId')
  async updateUserPermission(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.spacePermissionsService.updateUserPermission(spaceId, userId, updatePermissionDto, req.user.userId, req.user.role);
  }

  @Delete('users/:userId')
  async removeUserFromSpace(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.spacePermissionsService.removeUserFromSpace(spaceId, userId, req.user.userId, req.user.role);
    return { message: 'Utilisateur retiré de l\'espace avec succès' };
  }

  @Get('my-permissions')
  getMyPermissions(@Req() req: AuthenticatedRequest) {
    return this.spacePermissionsService.getUserSpacesWithPermissions(req.user.userId);
  }
}