import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';

export type DocumentDocument = Document & MongoDocument;

@Schema({ timestamps: true })
export class Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  publicId: string; // ID Cloudinary

  @Prop({ required: true })
  mimeType: string;

  @Prop()
  fileSize: number; // en bytes

  @Prop()
  rejectionReason?: string;

  @Prop()
  validatedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  validatedBy?: Types.ObjectId;

  @Prop()
  description?: string;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);