import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { RendezVousService } from './rendez-vous.service';
import { CreateRendezVousDto } from './dto/create-rendez-vous.dto';
import { UpdateRendezVousDto } from './dto/update-rendez-vous.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    nom?: string;
    prenoms?: string;
  };
}

@Controller('rendez-vous')
@UseGuards(JwtAuthGuard)
export class RendezVousController {
  constructor(private readonly rendezVousService: RendezVousService) {}

  // POST /rendez-vous — Créer son lien Calendly (admin/manager)
  @Post()
  async create(
    @Body() dto: CreateRendezVousDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { userId, role } = req.user;
    return this.rendezVousService.create(userId, role, dto);
  }

  // GET /rendez-vous — Récupérer tous les liens (tous les rôles)
  @Get()
  async findAll() {
    return this.rendezVousService.findAll();
  }

  // GET /rendez-vous/me — Récupérer son propre lien
  @Get('me')
  async findMyLink(@Req() req: AuthenticatedRequest) {
    return this.rendezVousService.findMyLink(req.user.userId);
  }

  // PATCH /rendez-vous/:id — Modifier un lien
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRendezVousDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rendezVousService.update(
      id,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  // DELETE /rendez-vous/:id — Supprimer un lien
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.rendezVousService.remove(id, req.user.userId, req.user.role);
  }
}
