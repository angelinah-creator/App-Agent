import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class ManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin ET Manager peuvent accéder
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) {
      return true;
    }

    throw new ForbiddenException('Accès réservé aux managers et administrateurs');
  }
}