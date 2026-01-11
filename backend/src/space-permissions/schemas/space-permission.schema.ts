import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SpacePermissionDocument = SpacePermission & Document;

export enum PermissionLevel {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  SUPER_EDITOR = 'super_editor'
}

@Schema({ timestamps: true })
export class SpacePermission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Space' })
  spaceId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: PermissionLevel, default: PermissionLevel.VIEWER })
  permissionLevel: PermissionLevel;
}

export const SpacePermissionSchema = SchemaFactory.createForClass(SpacePermission);

// Index composite pour éviter les doublons
SpacePermissionSchema.index({ spaceId: 1, userId: 1 }, { unique: true });