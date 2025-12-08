// backend/src/auth/google-auth.service.ts
import { Injectable, UnauthorizedException, Inject, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';

@Injectable()
export class GoogleAuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('FIREBASE_ADMIN') private firebaseAdmin: typeof admin,
  ) {}

  async authenticateWithGoogle(idToken: string) {
    try {
      // 1. Vérifier le token Firebase
      const decodedToken = await this.firebaseAdmin.auth().verifyIdToken(idToken);
      
      if (!decodedToken) {
        throw new UnauthorizedException('Token Google invalide');
      }

      const email = decodedToken.email;
      
      if (!email) {
        throw new UnauthorizedException('Email non fourni par Google');
      }

      // 2. Rechercher l'utilisateur existant
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        // 3. Si l'utilisateur n'existe pas, REFUSER la connexion
        throw new NotFoundException('Aucun compte trouvé avec cet email. Veuillez d\'abord créer un compte.');
      }

      // 4. Générer le token JWT pour l'utilisateur existant
      const userId = (user as any)._id.toString();

      const payload = { 
        sub: userId, 
        email: user.email, 
        profile: user.profile 
      };
      
      const token = this.jwtService.sign(payload);

      const userObj = (user as any).toObject();
      delete userObj.password;

      return {
        user: userObj,
        token,
      };
    } catch (error) {
      console.error('Erreur authentification Google:', error);
      
      // Différencier les types d'erreur
      if (error instanceof NotFoundException) {
        throw error; // Relancer l'erreur "utilisateur non trouvé"
      }
      
      throw new UnauthorizedException('Échec de l\'authentification Google');
    }
  }
}