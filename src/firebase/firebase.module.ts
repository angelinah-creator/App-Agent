// backend/src/firebase/firebase.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { firebaseAdminProvider } from './firebase-admin.provider';
@Global()
@Module({
  imports: [ConfigModule],
  providers: [firebaseAdminProvider],
  exports: [firebaseAdminProvider],
})
export class FirebaseModule {}