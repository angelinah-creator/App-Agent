// backend/src/firebase/firebase-admin.provider.ts
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const firebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: (configService: ConfigService) => {
    const projectId = configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = configService.get('FIREBASE_PRIVATE_KEY');

    console.log('=== Initialisation Firebase Admin ===');
    console.log('FIREBASE_PROJECT_ID:', projectId);
    console.log('FIREBASE_CLIENT_EMAIL:', clientEmail);
    console.log('FIREBASE_PRIVATE_KEY présent:', !!privateKey);

    if (projectId && clientEmail && privateKey) {
      console.log('✅ Toutes les variables Firebase sont présentes');

      if (!admin.apps.length) {
        try {
          const cleanedPrivateKey = privateKey.replace(/\\n/g, '\n');
          
          console.log('🔄 Tentative d\'initialisation Firebase Admin...');
          
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: cleanedPrivateKey,
            }),
          });
          
          console.log('✅ Firebase Admin initialisé avec succès');
        } catch (error) {
          console.error('❌ Erreur initialisation Firebase Admin:', error);
          throw error;
        }
      }
    } else {
      console.warn('⚠️  Variables Firebase manquantes. L\'authentification Google ne fonctionnera pas.');
    }

    return admin;
  },
  inject: [ConfigService],
};