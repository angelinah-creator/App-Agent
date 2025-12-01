// backend/src/absences/absences.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    profile: string;
  };
}

@Controller('absences')
@UseGuards(JwtAuthGuard)
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  // Agent: Créer une demande d'absence
  @Post()
  async createAbsence(
    @Body() createAbsenceDto: CreateAbsenceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.absencesService.createAbsence(
      req.user.userId,
      createAbsenceDto,
    );
  }

  // Agent: Voir ses absences
  @Get('my-absences')
  async getMyAbsences(@Req() req: AuthenticatedRequest) {
    return this.absencesService.getAgentAbsences(req.user.userId);
  }

  // Admin: Voir toutes les absences
  @Get('all')
  @UseGuards(AdminGuard)
  async getAllAbsences() {
    return this.absencesService.getAllAbsences();
  }

  // Admin: Voir les absences en attente
  @Get('pending')
  @UseGuards(AdminGuard)
  async getPendingAbsences() {
    return this.absencesService.getPendingAbsences();
  }

  // Admin: Mettre à jour le statut d'une absence
  @Put(':id/status')
  @UseGuards(AdminGuard)
  async updateAbsenceStatus(
    @Param('id') id: string,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.absencesService.updateAbsenceStatus(
      id,
      req.user.userId,
      updateAbsenceDto,
    );
  }

  // Admin: Mettre à jour une absence
  @Put(':id')
  @UseGuards(AdminGuard)
  async updateAbsence(
    @Param('id') id: string,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
  ) {
    return this.absencesService.updateAbsenceStatus(
      id,
      'admin', // Vous devrez passer l'ID admin réel
      updateAbsenceDto,
    );
  }

  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    if (req.user.profile === 'admin') {
      return this.absencesService.getAbsenceStats();
    } else {
      return this.absencesService.getAbsenceStats(req.user.userId);
    }
  }

  @Get(':id')
  async getAbsence(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const absence = await this.absencesService.getAbsenceById(id);
    
    // CORRECTION: Typage explicite pour la vérification
    const agentId = (absence.agentId as any)._id ? 
      (absence.agentId as any)._id.toString() : 
      (absence.agentId as any).toString();
    
    const isAdmin = req.user.profile === 'admin';
    const isOwner = agentId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Accès non autorisé');
    }

    return absence;
  }

  @Delete(':id')
  async deleteAbsence(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.absencesService.deleteAbsence(id, req.user.userId);
    return { message: 'Demande d\'absence supprimée avec succès' };
  }
}