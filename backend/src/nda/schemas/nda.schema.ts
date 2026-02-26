// backend/src/nda/schemas/nda.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NdaDocument = Nda & Document;

export enum NdaStatus {
  GENERATED = 'generated',
  SIGNED = 'signed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class Nda {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) // ✅ Ajout de l'index
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true }) // ✅ Ajout de l'index
  ndaNumber: string;

  @Prop({ required: true })
  pdfUrl: string;

  @Prop({ required: true })
  publicId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ 
    required: true, 
    enum: NdaStatus,
    default: NdaStatus.GENERATED,
    index: true // ✅ Ajout de l'index
  })
  status: NdaStatus;

  @Prop()
  signedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: false, index: true }) // ✅ Ajout de l'index
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;

  @Prop({ default: 0 })
  version: number;
}

export const NdaSchema = SchemaFactory.createForClass(Nda);

// Index composé pour optimiser les recherches
NdaSchema.index({ userId: 1, isArchived: 1, createdAt: -1 });