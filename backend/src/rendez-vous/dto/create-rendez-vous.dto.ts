import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLinksDto {
  @IsString() @IsOptional() facebook?: string;
  @IsString() @IsOptional() instagram?: string;
  @IsString() @IsOptional() linkedin?: string;
  @IsString() @IsOptional() tiktok?: string;
  @IsString() @IsOptional() x?: string;
  @IsString() @IsOptional() whatsapp?: string;
  @IsString() @IsOptional() youtube?: string;
  @IsString() @IsOptional() github?: string;
  @IsString() @IsOptional() website?: string;
}

export class CreateRendezVousDto {
  @IsString()
  @IsNotEmpty()
  lienCalendly: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;
}