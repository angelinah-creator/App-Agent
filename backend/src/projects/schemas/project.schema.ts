// backend/src/projects/schemas/project.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = ProjectEntity & Document;

export interface ProjectFile {
  url: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

@Schema({ timestamps: true })
export class ProjectEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId; // Le manager ou admin qui a créé le projet

  @Prop({ required: false, type: Date })
  start_time?: Date;

  @Prop({ required: false, type: Date })
  end_time?: Date;

  // Managers invités (peuvent tout faire sauf inviter des collaborateurs)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  invitedManagers: Types.ObjectId[];

  // Collaborateurs assignés au projet
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  invitedCollaborateurs: Types.ObjectId[];

  // Documents/fichiers du projet
  @Prop({
    type: [
      {
        url: String,
        publicId: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadedBy: { type: Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  files: ProjectFile[];
}

export const ProjectSchema = SchemaFactory.createForClass(ProjectEntity);