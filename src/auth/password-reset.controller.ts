import { Controller, Post, Body, Get, Query, HttpCode } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  @HttpCode(200)
  async requestPasswordReset(@Body('email') email: string) {
    await this.passwordResetService.requestPasswordReset(email);
    
    // Toujours retourner le même message pour des raisons de sécurité
    return {
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
    };
  }

  @Post('reset')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.passwordResetService.resetPassword(token, newPassword);
    
    return {
      message: 'Mot de passe réinitialisé avec succès'
    };
  }

  @Get('validate-token')
  async validateToken(@Query('token') token: string) {
    const isValid = await this.passwordResetService.validateResetToken(token);
    
    return { isValid };
  }
}