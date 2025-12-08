import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordResetService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email) as any;
    
    if (!user) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
      return;
    }

    // Générer un token de réinitialisation valide 1 heure
    const payload = { 
      sub: user._id.toString(), 
      email: user.email,
      type: 'password_reset'
    };
    
    const token = this.jwtService.sign(payload, { 
      expiresIn: '1h',
      secret: process.env.JWT_SECRET + '-reset' // Secret différent pour plus de sécurité
    });

    // Envoyer l'email de réinitialisation
    await this.mailService.sendPasswordResetEmail(user.email, user.prenoms, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Vérifier le token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET + '-reset'
      });

      // Vérifier que c'est bien un token de réinitialisation
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Token invalide');
      }

      const userId = payload.sub;
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await this.usersService.update(userId, { 
        password: hashedPassword 
      } as any);

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Le lien de réinitialisation a expiré');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token invalide');
      }
      throw error;
    }
  }

  async validateResetToken(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET + '-reset'
      });

      return payload.type === 'password_reset';
    } catch {
      return false;
    }
  }
}