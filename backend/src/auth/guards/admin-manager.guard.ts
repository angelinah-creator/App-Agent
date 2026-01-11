import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class AdminManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Accès réservé aux administrateurs et managers');
    }

    return true;
  }
}