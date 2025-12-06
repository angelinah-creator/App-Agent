import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from './google-auth.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private googleAuthService: GoogleAuthService,
    private cloudinaryService: CloudinaryService, // AJOUT
  ) {}

  @Post('signup')
  async register(
    @Body() body: any,
    @UploadedFile() signature?: Express.Multer.File,
  ) {
    let signatureUrl: string;
    // Cas 1: Fichier uploadé (form-data)
    if (signature) {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedMimeTypes.includes(signature.mimetype)) {
        throw new BadRequestException('Format de signature invalide');
      }

      const maxSize = 10 * 1024 * 1024;
      if (signature.size > maxSize) {
        throw new BadRequestException('La signature est trop volumineuse');
      }

      const fileName = `signature_${body.cin}_${Date.now()}`;
      const result = await this.cloudinaryService.uploadImage(
        signature.buffer,
        fileName,
      );
      signatureUrl = result.url;
    }
    // Cas 2: URL fournie (JSON)
    else if (body.signatureUrl) {
      signatureUrl = body.signatureUrl;
      delete body.signatureUrl;
    }
    // Cas 3: Aucune signature
    else {
      throw new BadRequestException('La signature est obligatoire');
    }
    const dto: RegisterDto = body;

    return this.authService.register(dto, signatureUrl);
  }

  @Post('signin')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  async googleAuth(@Body() body: { idToken: string }) {
    return this.googleAuthService.authenticateWithGoogle(body.idToken);
  }

  @Post('upload-signature')
  @UseInterceptors(FileInterceptor('signature'))
  async uploadSignature(
    @UploadedFile() signature: Express.Multer.File,
    @Body('cin') cin?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('La signature est obligatoire');
    }

    // Vérifier le type MIME
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedMimeTypes.includes(signature.mimetype)) {
      throw new BadRequestException(
        'Format de signature invalide. Formats acceptés : PNG, JPG, JPEG',
      );
    }

    // Vérifier la taille (10 Mo max)
    const maxSize = 10 * 1024 * 1024;
    if (signature.size > maxSize) {
      throw new BadRequestException(
        'La signature est trop volumineuse. Taille maximale : 10 Mo',
      );
    }

    // Générer un nom de fichier unique
    const fileName = `signature_${cin || 'temp'}_${Date.now()}`;

    // Upload vers Cloudinary
    const { url: signatureUrl, publicId } =
      await this.cloudinaryService.uploadImage(signature.buffer, fileName);

    return {
      signatureUrl,
      publicId,
      message: 'Signature uploadée avec succès',
    };
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
