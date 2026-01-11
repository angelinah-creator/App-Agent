import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  StartTimerDto,
  SyncOfflineEntriesDto,
  GetReportDto,
} from './dto/time-entry.dtos';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  // Démarrer le timer
  @Post('timer/start')
  startTimer(@Body() startTimerDto: StartTimerDto, @Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.startTimer(req.user.userId, startTimerDto);
  }

  // Mettre en pause
  @Post('timer/pause')
  pauseTimer(@Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.pauseTimer(req.user.userId);
  }

  // Reprendre
  @Post('timer/resume')
  resumeTimer(@Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.resumeTimer(req.user.userId);
  }

  // Arrêter
  @Post('timer/stop')
  stopTimer(@Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.stopTimer(req.user.userId);
  }

  // Récupérer le timer actif
  @Get('timer/active')
  getActiveTimer(@Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.getActiveTimer(req.user.userId);
  }

  // Créer une entrée manuelle
  @Post()
  createEntry(@Body() createDto: CreateTimeEntryDto, @Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.createEntry(req.user.userId, createDto);
  }

  // Mettre à jour une entrée
  @Put(':id')
  updateEntry(
    @Param('id') id: string,
    @Body() updateDto: UpdateTimeEntryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.timeEntriesService.updateEntry(req.user.userId, id, updateDto);
  }

  // Supprimer une entrée
  @Delete(':id')
  deleteEntry(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.deleteEntry(req.user.userId, id);
  }

  // Récupérer les entrées
  @Get()
  getEntries(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    return this.timeEntriesService.getEntries(
      req!.user.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Synchroniser les entrées hors ligne
  @Post('sync')
  syncOfflineEntries(@Body() syncDto: SyncOfflineEntriesDto, @Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.syncOfflineEntries(req.user.userId, syncDto);
  }

  // Générer un rapport
  @Get('report')
  getReport(@Query() reportDto: GetReportDto, @Req() req: AuthenticatedRequest) {
    return this.timeEntriesService.getReport(reportDto, req.user.userId, req.user.role);
  }
}