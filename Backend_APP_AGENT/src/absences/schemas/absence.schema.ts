// backend/src/absences/schemas/absence.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserDocument } from '../../users/schemas/user.schema'; // AJOUT

export type AbsenceDocument = Absence & Document;

export enum AbsenceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Schema({ timestamps: true })
export class Absence {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  agentId: Types.ObjectId | UserDocument; // AJOUT du type union

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  backupPerson: string;

  @Prop({ 
    required: true, 
    enum: AbsenceStatus, 
    default: AbsenceStatus.PENDING 
  })
  status: AbsenceStatus;

  @Prop()
  adminReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  validatedBy?: Types.ObjectId;

  @Prop()
  validatedAt?: Date;

  @Prop()
  duration?: number;
}

export const AbsenceSchema = SchemaFactory.createForClass(Absence);

// Middleware pour calculer la durée avant sauvegarde
AbsenceSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    this.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});