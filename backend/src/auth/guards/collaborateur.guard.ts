// backend/src/auth/guards/collaborateur.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class CollaborateurGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== UserRole.COLLABORATEUR && user?.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Accès réservé aux collaborateurs et managers');
    }

    return true;
  }
}