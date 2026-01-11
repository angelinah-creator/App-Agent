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
import type { Response } from 'express';
import { KPIsService } from './kpis.service';
import { CreateKPIDto } from './dto/create-kpi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KPIType } from './schemas/kpis.schema';
import { Request } from 'express';
import { AdminGuard } from 'src/auth/guards/admin.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    profile: string;
  };
}

@Controller('kpis')
@UseGuards(JwtAuthGuard)
export class KPIsController {
  constructor(private readonly kpisService: KPIsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadKPI(
    @UploadedFile() file: Express.Multer.File,
    @Body() createKPIDto: CreateKPIDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    // FORCER le type à rapport_mensuel
    const kpiData = {
      ...createKPIDto,
      type: KPIType.RAPPORT_MENSUEL
    };

    return this.kpisService.uploadKPI(req.user.userId, file, kpiData);
  }

  @Get('my-kpis')
  async getMyKPIs(@Req() req: AuthenticatedRequest) {
    return this.kpisService.getUserKPIs(req.user.userId);
  }

  /**
   * Admin: Récupérer tous les KPIs avec les données utilisateurs peuplées
   */
  @Get('all')
  @UseGuards(AdminGuard)
  async getAllKPIs() {
    return this.kpisService.getAllKPIs();
  }

  @Get('stats')
  async getMyStats(@Req() req: AuthenticatedRequest) {
    return this.kpisService.getKPIsStats(req.user.userId);
  }

  @Get('download/:id')
  async downloadKPI(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const kpi = await this.kpisService.getKPIById(id, req.user.userId);
    return res.redirect(kpi.fileUrl);
  }

  @Get(':id')
  async getKPI(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.kpisService.getKPIById(id, req.user.userId);
  }

  @Delete(':id')
  async deleteKPI(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.kpisService.deleteKPI(id, req.user.userId);
    return { message: 'KPI supprimé avec succès' };
  }
}