import { PartialType } from '@nestjs/mapped-types';
import { CreateRendezVousDto } from './create-rendez-vous.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRendezVousDto extends PartialType(CreateRendezVousDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}