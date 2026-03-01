// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetController } from './password-reset.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'default_secret',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '3600s',
        },
      }),
    }),
  ],
  controllers: [AuthController, PasswordResetController],
  providers: [AuthService, JwtStrategy, GoogleAuthService, PasswordResetService],
  exports: [AuthService],
})
export class AuthModule {}