import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimeEntryDocument = TimeEntry & Document;

export enum TimerStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

@Schema({ timestamps: true, collection: 'time_entries' })
export class TimeEntry {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PersonalTask' })
  personalTaskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SharedTask' })
  sharedTaskId?: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop({ default: 0 })
  duration: number; // en secondes

  @Prop({ enum: TimerStatus, default: TimerStatus.STOPPED })
  status: TimerStatus;

  @Prop({ type: [Date], default: [] })
  pausedAt: Date[];

  @Prop({ type: [Date], default: [] })
  resumedAt: Date[];

  @Prop({ default: false })
  syncedFromOffline: boolean;

  @Prop()
  offlineId?: string;

  @Prop({ type: Date })
  date: Date; // Date de l'entrée pour les rapports
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntry);

// Index pour optimiser les requêtes
TimeEntrySchema.index({ userId: 1, date: -1 });
TimeEntrySchema.index({ userId: 1, status: 1 });
TimeEntrySchema.index({ projectId: 1, date: -1 });