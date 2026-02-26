// backend/src/ndas/ndas.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { NdasService } from './nda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserRole } from '../users/schemas/user.schema';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    profile?: string;
  };
}

@Controller('ndas')
@UseGuards(JwtAuthGuard)
export class NdasController {
  constructor(private readonly ndasService: NdasService) {}

  /**
   * Générer un NDA pour un utilisateur
   * Accessible par l'admin ou l'utilisateur lui-même
   */
  @Post('generate/:userId')
  async generateNda(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = userId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.ndasService.generateNda(userId);
  }

  /**
   * Récupérer tous les NDAs (admin seulement)
   */
  @Get()
  @UseGuards(AdminGuard)
  async findAll(
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.ndasService.findAll({
      includeArchived: includeArchived === 'true',
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
  }

  /**
   * Récupérer les NDAs d'un utilisateur spécifique
   */
  @Get('user/:userId')
  async findUserNdas(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = userId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.ndasService.findUserNdas(userId);
  }

  /**
   * Récupérer un NDA par son ID
   */
  @Get(':ndaId')
  async findById(
    @Param('ndaId') ndaId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const nda = await this.ndasService.findById(ndaId);
    
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = nda.userId.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return nda;
  }

  /**
   * Régénérer un NDA
   */
  @Put('regenerate/:ndaId')
  async regenerateNda(
    @Param('ndaId') ndaId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const nda = await this.ndasService.findById(ndaId);
    
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = nda.userId.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.ndasService.regenerateNda(ndaId);
  }

  /**
   * Marquer un NDA comme signé
   */
  @Put(':ndaId/sign')
  async markAsSigned(
    @Param('ndaId') ndaId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const nda = await this.ndasService.findById(ndaId);
    
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = nda.userId.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.ndasService.markAsSigned(ndaId);
  }

  /**
   * Supprimer un NDA
   */
  @Delete(':ndaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNda(@Param('ndaId') ndaId: string) {
    await this.ndasService.deleteNda(ndaId);
  }

  /**
   * Archiver un NDA (admin seulement)
   */
  @Put(':ndaId/archive')
  @UseGuards(AdminGuard)
  async archiveNda(@Param('ndaId') ndaId: string) {
    return this.ndasService.archiveNda(ndaId);
  }

  /**
   * Restaurer un NDA archivé (admin seulement)
   */
  @Put(':ndaId/restore')
  @UseGuards(AdminGuard)
  async restoreNda(@Param('ndaId') ndaId: string) {
    return this.ndasService.restoreNda(ndaId);
  }

  /**
   * Statistiques des NDAs (admin seulement)
   */
  @Get('stats/all')
  @UseGuards(AdminGuard)
  async getNdaStats() {
    return this.ndasService.getNdaStats();
  }
}