import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';

export type KPIDocument = KPI & MongoDocument;

// SUPPRIMER les autres types, garder seulement RAPPORT_MENSUEL
export enum KPIType {
  RAPPORT_MENSUEL = 'rapport_mensuel'
}

@Schema({ timestamps: true })
export class KPI {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ 
    required: true, 
    enum: KPIType, 
    default: KPIType.RAPPORT_MENSUEL // Valeur par défaut
  })
  type: KPIType;

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

  @Prop({ required: true })
  periode: string; // Format: YYYY-MM (ex: 2025-01)

  @Prop()
  description?: string;
}

export const KPISchema = SchemaFactory.createForClass(KPI);