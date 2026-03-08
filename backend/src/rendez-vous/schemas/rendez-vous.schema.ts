import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RendezVousDocument = RendezVous & Document;

@Schema({ _id: false })
export class SocialLinks {
  @Prop() facebook?: string;
  @Prop() instagram?: string;
  @Prop() linkedin?: string;
  @Prop() tiktok?: string;
  @Prop() x?: string;
  @Prop() whatsapp?: string;
  @Prop() youtube?: string;
  @Prop() github?: string;
  @Prop() website?: string;
}

export const SocialLinksSchema = SchemaFactory.createForClass(SocialLinks);

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

  @Prop({ required: true, enum: ['admin', 'manager', 'collaborateur'] })
  role: string;

  @Prop({ required: true })
  lienCalendly: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: SocialLinksSchema })
  socialLinks?: SocialLinks;

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