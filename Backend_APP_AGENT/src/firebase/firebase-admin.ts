// backend/src/firebase/firebase-admin.ts
import * as admin from 'firebase-admin'

console.log('=== Initialisation Firebase Admin ===');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY présent:', !!process.env.FIREBASE_PRIVATE_KEY);

// Vérifier aussi d'autres variables pour confirmer que .env est chargé
console.log('MONGO_URI présent:', !!process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  console.log('✅ Toutes les variables Firebase sont présentes');
  
  if (!admin.apps.length) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      console.log('🔄 Tentative d\'initialisation Firebase Admin...');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      
      console.log('✅ Firebase Admin initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase Admin:', error);
    }
  }
} else {
  console.warn('⚠️  Variables Firebase manquantes. L\'authentification Google ne fonctionnera pas.');
}

export const firebaseAdmin = admin;