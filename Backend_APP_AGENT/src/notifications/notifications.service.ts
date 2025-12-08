// backend/src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private usersService: UsersService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    absenceId?: string,
    invoiceId?: string,
  ): Promise<NotificationDocument> {
    const notificationData: any = {
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      read: false,
    };

    if (absenceId) {
      notificationData.absenceId = new Types.ObjectId(absenceId);
    }

    if (invoiceId) {
      notificationData.invoiceId = new Types.ObjectId(invoiceId);
    }

    const notification = new this.notificationModel(notificationData);
    const saved = await notification.save();
    
    console.log('✅ Notification créée:', {
      userId,
      type,
      title,
      message,
      notificationId: saved.id
    });

    return saved;
  }

  /**
   * Récupérer les notifications d'un utilisateur avec populate amélioré
   */
  async getUserNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'absenceId',
        populate: {
          path: 'agentId',
          select: 'nom prenoms email profile'
        }
      })
      .populate({
        path: 'invoiceId',
        populate: [
          {
            path: 'agentId',
            select: 'nom prenoms email profile'
          },
          {
            path: 'processedBy',
            select: 'nom prenoms'
          }
        ]
      })
      .populate({
        path: 'userId',
        select: 'nom prenoms email profile'
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Récupérer les notifications non lues avec populate amélioré
   */
  async getUnreadNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ 
        userId: new Types.ObjectId(userId),
        read: false 
      })
      .populate({
        path: 'absenceId',
        populate: {
          path: 'agentId',
          select: 'nom prenoms email profile'
        }
      })
      .populate({
        path: 'invoiceId',
        populate: [
          {
            path: 'agentId',
            select: 'nom prenoms email profile'
          },
          {
            path: 'processedBy',
            select: 'nom prenoms'
          }
        ]
      })
      .populate({
        path: 'userId',
        select: 'nom prenoms email profile'
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    const result = await this.notificationModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(notificationId), 
        userId: new Types.ObjectId(userId) 
      },
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    )
    .populate({
      path: 'absenceId',
      populate: {
        path: 'agentId',
        select: 'nom prenoms email profile'
      }
    })
    .populate({
      path: 'invoiceId',
      populate: [
        {
          path: 'agentId',
          select: 'nom prenoms email profile'
        },
        {
          path: 'processedBy',
          select: 'nom prenoms'
        }
      ]
    })
    .populate({
      path: 'userId',
      select: 'nom prenoms email profile'
    })
    .exec();

    return result;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { 
        userId: new Types.ObjectId(userId),
        read: false 
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    ).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ 
        userId: new Types.ObjectId(userId), 
        read: false 
      })
      .exec();
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId)
    }).exec();
  }

  async deleteReadNotifications(userId: string): Promise<void> {
    await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
      read: true
    }).exec();
  }

  // Méthodes utilitaires améliorées
  private extractUserId(user: any): string {
    if (user instanceof Types.ObjectId) {
      return user.toString();
    }
    if (user && user._id) {
      return user._id.toString();
    }
    if (typeof user === 'string') {
      return user;
    }
    throw new Error('Format d\'ID utilisateur invalide');
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }
}