import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

export enum ContractType {
  STAGIAIRE = 'stagiaire',
  PRESTATAIRE = 'prestataire',
}

@Schema({ timestamps: true })
export class Contract {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ContractType })
  type: ContractType;

  @Prop({ required: true })
  contractNumber: string;

  @Prop({ required: true })
  pdfUrl: string;

  @Prop({ required: true })
  publicId: string; // ID unique Cloudinary

  @Prop({ required: true })
  fileName: string;

  @Prop({ default: 'generated' })
  status: string; // generated, signed, cancelled

  @Prop()
  signedAt?: Date;

  @Prop()
  expiresAt?: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);