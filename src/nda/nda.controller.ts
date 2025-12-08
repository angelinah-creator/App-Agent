import { Controller, Post, Get, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { NdaService } from './nda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('nda')
@UseGuards(JwtAuthGuard)
export class NdaController {
  constructor(private readonly ndaService: NdaService) {}

  @Post('generate/:userId')
  // @UseGuards(AdminGuard)
  async generateNda(@Param('userId') userId: string) {
    return this.ndaService.generateNda(userId);
  }

  @Get('user/:userId')
  async getUserNda(@Param('userId') userId: string) {
    const nda = await this.ndaService.getUserNda(userId);
    if (!nda) {
      return { message: 'Aucun NDA trouvé pour cet utilisateur' };
    }
    return nda;
  }

  @Get(':ndaId')
  async getNda(@Param('ndaId') ndaId: string) {
    return this.ndaService.getNdaById(ndaId);
  }

  @Put('regenerate/:userId')
  // @UseGuards(AdminGuard)
  async regenerateNda(@Param('userId') userId: string) {
    return this.ndaService.regenerateNda(userId);
  }

  @Delete(':ndaId')
  // @UseGuards(AdminGuard)
  async deleteNda(@Param('ndaId') ndaId: string) {
    await this.ndaService.deleteNda(ndaId);
    return { message: 'NDA supprimé avec succès' };
  }
}