// backend/src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    profile: string;
  };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Récupérer toutes les notifications de l'utilisateur
   */
  @Get()
  async getMyNotifications(@Req() req: AuthenticatedRequest) {
    const notifications = await this.notificationsService.getUserNotifications(req.user.userId);
    return notifications;
  }

  /**
   * Récupérer uniquement les notifications non lues
   */
  @Get('unread')
  async getUnreadNotifications(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getUnreadNotifications(req.user.userId);
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  /**
   * Marquer une notification comme lue
   */
  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  @Put('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { message: 'Toutes les notifications marquées comme lues' };
  }

  /**
   * Supprimer une notification
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.notificationsService.deleteNotification(id, req.user.userId);
    return { message: 'Notification supprimée' };
  }

  /**
   * Supprimer toutes les notifications lues
   */
  @Delete('read/all')
  async deleteReadNotifications(@Req() req: AuthenticatedRequest) {
    await this.notificationsService.deleteReadNotifications(req.user.userId);
    return { message: 'Notifications lues supprimées' };
  }
}