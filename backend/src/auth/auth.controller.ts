// backend/src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Req, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from './google-auth.service';
import { CreateClientDto } from '../users/dto/create-client.dto';

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

  @Post('clients')
  @UseGuards(JwtAuthGuard)
  async createClient(@Body() dto: CreateClientDto) {
    return this.authService.createClient(dto);
  }

  @Patch('clients/complete-profile')
  @UseGuards(JwtAuthGuard)
  async completeClientProfile(@Req() req: Request, @Body() profileData: any) {
    const userPayload: any = req.user;
    return this.authService.completeClientProfile(userPayload.userId, profileData);
  }

  @Post('google')
  async googleAuth(@Body() body: { idToken: string }) {
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