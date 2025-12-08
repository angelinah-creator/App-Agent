// backend/src/absences/absences.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AbsencesController } from './absences.controller';
import { AbsencesService } from './absences.service';
import { Absence, AbsenceSchema } from './schemas/absence.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Absence.name, schema: AbsenceSchema }]),
    UsersModule,
    NotificationsModule,
    MailModule,
  ],
  controllers: [AbsencesController],
  providers: [AbsencesService],
  exports: [AbsencesService],
})
export class AbsencesModule {}