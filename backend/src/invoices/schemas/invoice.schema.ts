// backend/src/invoices/schemas/invoice.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  PENDING = 'pending',  // En attente
  PAID = 'paid',        // Payée
  UNPAID = 'unpaid'     // Non payée
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  agentId: Types.ObjectId;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ required: true })
  pdfUrl: string;

  @Prop({ required: true })
  publicId: string;

  @Prop()
  amount?: number;

  @Prop()
  paymentDate?: Date;

  @Prop()
  transferReference?: string;

  @Prop({ 
    required: true, 
    enum: InvoiceStatus, 
    default: InvoiceStatus.PENDING 
  })
  status: InvoiceStatus;

  @Prop()
  fileName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @Prop()
  processedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);