// backend/src/notifications/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  // Notifications Absences
  ABSENCE_CREATED = 'absence_created',
  ABSENCE_APPROVED = 'absence_approved',
  ABSENCE_REJECTED = 'absence_rejected',
  
  // NOUVEAU: Notifications Factures
  INVOICE_CREATED = 'invoice_created',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_OVERDUE = 'invoice_overdue' 
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Absence' })
  absenceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Invoice' }) // NOUVEAU
  invoiceId?: Types.ObjectId;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);