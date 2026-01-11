import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class PersonalTaskGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const taskUserId = request.params.userId;

    // Les admins et managers peuvent voir les tâches des autres utilisateurs
    if (user.role === 'admin' || user.role === 'manager') {
      return true;
    }

    // Les utilisateurs normaux ne peuvent voir que leurs propres tâches
    if (user.userId !== taskUserId) {
      throw new ForbiddenException('Accès non autorisé aux tâches de cet utilisateur');
    }

    return true;
  }
}