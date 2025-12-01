// backend/src/scripts/create-admin.ts
import { NestFactory } from '@nestjs/core';
import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';

async function createAdmin() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/app_agent_code_talent';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    const adminData = {
      profile: 'admin',
      nom: 'Admin',
      prenoms: 'admin',
      dateNaissance: new Date('1980-01-01'),
      genre: 'Homme',
      adresse: 'Siège social',
      cin: 'ADMIN001',
      poste: 'Administrateur',
      dateDebut: new Date(),
      dateFinIndeterminee: true,
      tjm: 0,
      telephone: '+1234567890',
      email: 'angelinah@info.code-talent.fr',
      password: await bcrypt.hash('admin123', 10),
      // NOUVEAUX CHAMPS D'ARCHIVAGE
      archived: false,
      archivedAt: null,
      archiveReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const existingAdmin = await usersCollection.findOne({ email: adminData.email });
      if (existingAdmin) {
        console.log('✅ Compte admin existe déjà');

        // Mettre à jour l'admin existant avec les champs d'archivage si nécessaire
        if (existingAdmin.archived === undefined) {
          await usersCollection.updateOne(
            { email: adminData.email },
            {
              $set: {
                archived: false,
                archivedAt: null,
                archiveReason: null,
                updatedAt: new Date()
              }
            }
          );
          console.log('✅ Champs d\'archivage ajoutés à l\'admin existant');
        }
      } else {
        await usersCollection.insertOne(adminData);
        console.log('✅ Compte admin créé avec succès');
        console.log('📧 Email: angelinah@info.code-talent.fr');
        console.log('🔑 Mot de passe: admin123');
        console.log('📊 Champs d\'archivage inclus');
      }
    } catch (error) {
      console.error('❌ Erreur création admin:', error);
    }
  } finally {
    await client.close();
  }
}

createAdmin();