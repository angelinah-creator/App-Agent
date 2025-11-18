import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// ✅ CORRECTION : Utiliser 'import type' pour les types uniquement
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentType } from './schemas/document.schema';
import { Request } from 'express';
import { AdminGuard } from 'src/auth/guards/admin.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    profile: string;
  };
}

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    return this.documentsService.uploadDocument(
      req.user.userId,
      file,
      createDocumentDto,
    );
  }

  @Get('my-documents')
  async getMyDocuments(@Req() req: AuthenticatedRequest) {
    return this.documentsService.getUserDocuments(req.user.userId);
  }

  @Get('my-documents/:type')
  async getMyDocumentsByType(
    @Param('type') type: DocumentType,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentsService.getUserDocumentsByType(req.user.userId, type);
  }

  @Get('stats')
  async getMyStats(@Req() req: AuthenticatedRequest) {
    return this.documentsService.getDocumentsStats(req.user.userId);
  }

  // ✅ ROUTE DE TÉLÉCHARGEMENT
  @Get('download/:id')
  async downloadDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const document = await this.documentsService.getDocumentById(
      id,
      req.user.userId,
    );

    // Rediriger vers l'URL Cloudinary
    return res.redirect(document.fileUrl);
  }

  @Get(':id')
  async getDocument(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.documentsService.getDocumentById(id, req.user.userId);
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.documentsService.deleteDocument(id, req.user.userId);
    return { message: 'Document supprimé avec succès' };
  }

  @Get('user/:userId')
  @UseGuards(AdminGuard)
  async getUserDocuments(@Param('userId') userId: string) {
    return this.documentsService.getUserDocuments(userId);
  }
}
