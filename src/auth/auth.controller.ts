import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Req, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException 
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
  @UseInterceptors(FileInterceptor('signature')) // AJOUT : intercepte le fichier
  async register(
    @Body() dto: RegisterDto,
    @UploadedFile() signature: Express.Multer.File, // AJOUT
  ) {
    // VALIDATION DU FICHIER
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
    const maxSize = 10 * 1024 * 1024; // 10 Mo en octets
    if (signature.size > maxSize) {
      throw new BadRequestException(
        'La signature est trop volumineuse. Taille maximale : 10 Mo',
      );
    }

    // UPLOAD vers Cloudinary
    const fileName = `signature_${dto.cin}_${Date.now()}`;
    const { url: signatureUrl } = await this.cloudinaryService.uploadImage(
      signature.buffer,
      fileName,
    );

    // Appeler le service avec l'URL de la signature
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