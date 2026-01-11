import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SharedTaskDocument = SharedTask & Document;

export enum TaskPriority {
  URGENTE = 'urgente',
  ELEVEE = 'élevée',
  NORMALE = 'normale',
  BASSE = 'basse'
}

export enum TaskStatus {
  A_FAIRE = 'à faire',
  EN_COURS = 'en cours',
  TERMINEE = 'terminée',
  ANNULEE = 'annulée'
}

@Schema({ timestamps: true, collection: 'shared_tasks' })
export class SharedTask {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  start_date?: Date;

  @Prop()
  end_date?: Date;

  @Prop({ enum: TaskPriority, default: TaskPriority.NORMALE })
  priority: TaskPriority;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignees: Types.ObjectId[];

  @Prop({ enum: TaskStatus, default: TaskStatus.A_FAIRE })
  status: TaskStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'SharedTask' }], default: [] })
  sub_tasks: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'SharedTask', default: null })
  parentTaskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Space', required: true })
  spaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const SharedTaskSchema = SchemaFactory.createForClass(SharedTask);

// Empêcher les références circulaires
SharedTaskSchema.pre('save', async function(next) {
  if (this.parentTaskId && this.parentTaskId.equals(this._id)) {
    throw new Error('Une tâche ne peut pas être sa propre parente');
  }
  next();
});