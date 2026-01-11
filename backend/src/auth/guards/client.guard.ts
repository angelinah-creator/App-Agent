// backend/src/auth/guards/client.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class ClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== UserRole.CLIENT) { // UTILISER l'enum
      throw new ForbiddenException('Accès réservé aux clients');
    }

    return true;
  }
}