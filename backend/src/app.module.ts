// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ContractsModule } from './contracts/contracts.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DocumentsModule } from './documents/documents.module';
import { KPIsModule } from './kpis/kpis.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AbsencesModule } from './absences/absences.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FirebaseModule } from './firebase/firebase.module';
import { MailModule } from './mail/mail.module';
import { VideosModule } from './videos/videos.module';
import { ProjectsModule } from './projects/projects.module';
import { SpacesModule } from './spaces/spaces.module';
import { SpacePermissionsModule } from './space-permissions/space-permissions.module';
import { PersonalTasksModule } from './personal-tasks/personal-tasks.module';
import { SharedTasksModule } from './shared-tasks/shared-tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule, // AJOUT - après ConfigModule
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/app_agent_code_talent'),
    UsersModule,
    AuthModule,
    ContractsModule,
    CloudinaryModule,
    DocumentsModule, 
    KPIsModule,
    InvoicesModule,
    AbsencesModule,
    NotificationsModule,
    MailModule,
    VideosModule,
    ProjectsModule,
    SpacesModule,
    SpacePermissionsModule,
    PersonalTasksModule,
    SharedTasksModule,
    TimeEntriesModule,
  ],
})
export class AppModule {}