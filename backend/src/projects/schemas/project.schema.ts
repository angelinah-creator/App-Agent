import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Client' })
  id_client: Types.ObjectId;

  @Prop({ required: false, type: Date })
  start_time?: Date;

  @Prop({ required: false, type: Date })
  end_time?: Date;

  @Prop({ required: true, type: [{ type: Types.ObjectId, ref: 'User' }] })
  agent_affectes: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);