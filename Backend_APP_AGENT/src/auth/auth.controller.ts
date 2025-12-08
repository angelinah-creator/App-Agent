// backend/src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService, 
    private usersService: UsersService,
    private googleAuthService: GoogleAuthService,
  ) {}

  @Post('signup')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('signin')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // NOUVEAU: Route pour l'authentification Google (uniquement pour les utilisateurs existants)
  @Post('google')
  async googleAuth(@Body() body: { idToken: string }) {
    // N'envoyer que le token, pas l'email ou le displayName
    return this.googleAuthService.authenticateWithGoogle(body.idToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async profile(@Req() req: Request) {
    const userPayload: any = req.user;
    const user = await this.usersService.findOne(userPayload.userId);
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }
}