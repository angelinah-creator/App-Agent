import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RendezVousDocument = RendezVous & Document;

@Schema({
  timestamps: true,
  collection: 'rendez-vous',
})
export class RendezVous {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenoms: string;

  @Prop({ required: true, enum: ['admin', 'manager'] })
  role: string;

  @Prop({ required: true })
  lienCalendly: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      url: String,
      publicId: String,
    },
  })
  profilePhoto?: {
    url: string;
    publicId: string;
  };
}

export const RendezVousSchema = SchemaFactory.createForClass(RendezVous);
