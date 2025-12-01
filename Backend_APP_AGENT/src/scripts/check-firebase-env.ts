// backend/src/scripts/check-firebase-env.ts
import * as dotenv from 'dotenv';

// Charger le fichier .env manuellement
dotenv.config();

console.log('=== Vérification des variables Firebase ===');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');

if (process.env.FIREBASE_PRIVATE_KEY) {
  console.log('Longueur clé privée:', process.env.FIREBASE_PRIVATE_KEY.length);
}