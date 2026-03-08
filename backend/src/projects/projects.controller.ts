// backend/src/projects/projects.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
  Res,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import * as https from 'https';
import * as http from 'http';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ─── CRUD DE BASE ─────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { userId, role } = req.user;

    // Seuls les admins et managers peuvent créer des projets
    if (role !== 'admin' && role !== 'manager') {
      throw new BadRequestException(
        'Seuls les managers et administrateurs peuvent créer des projets',
      );
    }

    return this.projectsService.create(createProjectDto, userId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    const { userId, role } = req.user;

    if (role === 'admin') {
      return this.projectsService.findAllForAdmin();
    } else if (role === 'manager') {
      return this.projectsService.findAllForManager(userId);
    } else if (role === 'collaborateur') {
      return this.projectsService.findAllForCollaborateur(userId);
    }

    throw new BadRequestException('Rôle non autorisé');
  }

  // ─── MEMBRES DISPONIBLES (accessible managers + admins) ─────────────────────

  /**
   * Retourne tous les managers et collaborateurs disponibles à inviter.
   * Accessible aux managers ET admins (contrairement à GET /users qui est admin only).
   */
  @Get('available-members')
  getAvailableMembers(@Req() req: AuthenticatedRequest) {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'manager') {
      throw new BadRequestException('Accès non autorisé');
    }
    return this.projectsService.getAvailableMembers();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.projectsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.update(
      id,
      updateProjectDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.projectsService.remove(id, req.user.userId, req.user.role);
  }

  // ─── GESTION DES FICHIERS ─────────────────────────────────────────────────────

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('Fichier trop volumineux (max 50MB)');
    }
    return this.projectsService.uploadFile(
      id,
      file,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id/files/:publicId')
  deleteFile(
    @Param('id') id: string,
    @Param('publicId') publicId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Décoder le publicId car il peut contenir des slashes
    const decodedPublicId = decodeURIComponent(publicId);
    return this.projectsService.deleteFile(
      id,
      decodedPublicId,
      req.user.userId,
      req.user.role,
    );
  }


  @Get(':id/files/:publicId/download')
  async downloadFile(
    @Param('id') id: string,
    @Param('publicId') publicId: string,
    @Query('name') originalName: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const decodedPublicId = decodeURIComponent(publicId);
    const decodedName = decodeURIComponent(originalName || 'fichier');

    // Vérifier l'accès au projet
    const project = await this.projectsService.findOne(
      id,
      req.user.userId,
      req.user.role,
    );

    // Vérifier que le fichier appartient bien au projet
    const file = project.files.find((f: any) => f.publicId === decodedPublicId);
    if (!file) {
      res.status(404).json({ message: 'Fichier introuvable' });
      return;
    }

    // Proxy stream depuis Cloudinary vers le client
    // Cela contourne les restrictions CORS de Cloudinary
    const fileUrl = file.url;
    const protocol = fileUrl.startsWith('https') ? https : http;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(decodedName)}"`,
    );
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

    protocol.get(fileUrl, (fileRes) => {
      fileRes.pipe(res);
    }).on('error', () => {
      res.status(500).json({ message: 'Erreur lors du téléchargement' });
    });
  }

  // ─── GESTION DES MEMBRES ──────────────────────────────────────────────────────

  @Post(':id/invite-manager/:managerId')
  inviteManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.inviteManager(
      id,
      managerId,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id/remove-manager/:managerId')
  removeManager(
    @Param('id') id: string,
    @Param('managerId') managerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.removeManager(
      id,
      managerId,
      req.user.userId,
      req.user.role,
    );
  }

  @Post(':id/invite-collaborateur/:collaborateurId')
  inviteCollaborateur(
    @Param('id') id: string,
    @Param('collaborateurId') collaborateurId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.inviteCollaborateur(
      id,
      collaborateurId,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id/remove-collaborateur/:collaborateurId')
  removeCollaborateur(
    @Param('id') id: string,
    @Param('collaborateurId') collaborateurId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.removeCollaborateur(
      id,
      collaborateurId,
      req.user.userId,
      req.user.role,
    );
  }
}