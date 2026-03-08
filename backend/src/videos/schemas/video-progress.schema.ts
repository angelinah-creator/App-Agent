import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VideoProgressDocument = VideoProgress & Document;

@Schema({ timestamps: true, collection: 'video-progress' })
export class VideoProgress {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Video' })
  videoId: Types.ObjectId;

  @Prop({ default: false })
  watched: boolean;

  @Prop({ default: 0 })
  watchedAt?: Date;
}

export const VideoProgressSchema = SchemaFactory.createForClass(VideoProgress);

// Index unique pour éviter les doublons
VideoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });