import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NdaDocument = Nda & Document;

@Schema({ timestamps: true })
export class Nda {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  ndaNumber: string;

  @Prop({ required: true })
  pdfUrl: string;

  @Prop({ required: true })
  publicId: string; // ID unique Cloudinary

  @Prop({ required: true })
  fileName: string;

  @Prop({ default: 'generated' })
  status: string; // generated, deleted
}

export const NdaSchema = SchemaFactory.createForClass(Nda);