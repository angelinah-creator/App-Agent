import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SpacePermissionsService } from '../space-permissions.service';

@Injectable()
export class SpacePermissionGuard implements CanActivate {
  constructor(private spacePermissionsService: SpacePermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const spaceId = request.params.spaceId;

    if (!spaceId) {
      return false;
    }

    // Les admins et managers ont automatiquement accès à tous les espaces
    if (user.role === 'admin' || user.role === 'manager') {
      return true;
    }

    // Pour les autres utilisateurs, vérifier les permissions dans l'espace
    const permission = await this.spacePermissionsService.getUserPermission(spaceId, user.userId);
    
    if (!permission) {
      throw new ForbiddenException('Vous n\'avez pas accès à cet espace');
    }

    return true;
  }
}