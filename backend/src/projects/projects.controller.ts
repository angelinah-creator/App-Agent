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
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminManagerGuard } from '../auth/guards/admin-manager.guard'; // Ajout
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import * as https from 'https';
import * as http from 'http';
import { UsersService } from '../users/users.service'; // Ajout

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
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService, // Ajout
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { userId, role } = req.user;
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

  @Get('available-members')
  getAvailableMembers(@Req() req: AuthenticatedRequest) {
    const { role } = req.user;
    if (role !== 'admin' && role !== 'manager') {
      throw new BadRequestException('Accès non autorisé');
    }
    return this.projectsService.getAvailableMembers();
  }

  // NOUVELLE ROUTE POUR RAPPORT COLLABORATEUR
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, AdminManagerGuard)
  async findForUser(@Param('userId') userId: string, @Req() req: AuthenticatedRequest) {
    const targetUser = await this.usersService.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return this.projectsService.findAllForUser(userId, targetUser.role);
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

    const project = await this.projectsService.findOne(
      id,
      req.user.userId,
      req.user.role,
    );

    const file = project.files.find((f: any) => f.publicId === decodedPublicId);
    if (!file) {
      res.status(404).json({ message: 'Fichier introuvable' });
      return;
    }

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