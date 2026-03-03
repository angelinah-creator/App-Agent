import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Req,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { VideosService } from './videos.service';
import { ChapterDto, CreateVideoDto, UpdateVideoDto } from './dto/create-video.dto';
import { Video } from './schemas/video.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManagerGuard } from '../auth/guards/manager.guard';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // Upload - Admin et Manager seulement
  @Post('upload')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() request: express.Request,
  ): Promise<Video> {
    if (!file) {
      throw new BadRequestException('Fichier vidéo requis');
    }

    let chapters: ChapterDto[] = [];
    if (body.chapters) {
      try {
        chapters = JSON.parse(body.chapters);
      } catch {
        throw new BadRequestException('Format des chapitres invalide');
      }
    }

    const createVideoDto: CreateVideoDto = {
      title: body.title,
      description: body.description,
      chapters,
    };

    const user = request.user as any;
    return this.videosService.create(createVideoDto, file, user.userId);
  }

  // Récupérer toutes les vidéos actives (collaborateurs)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Video[]> {
    return this.videosService.findAll();
  }

  // Récupérer toutes les vidéos (admin - inclut inactives)
  @Get('admin')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async findAllAdmin(): Promise<Video[]> {
    return this.videosService.findAllAdmin();
  }

  // Récupérer une vidéo par ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<Video> {
    return this.videosService.findOne(id);
  }

  // Incrémenter les vues
  @Patch(':id/view')
  @UseGuards(JwtAuthGuard)
  async incrementViews(@Param('id') id: string): Promise<{ message: string }> {
    await this.videosService.incrementViews(id);
    return { message: 'Vue enregistrée' };
  }

  // Modification - Admin et Manager seulement
  @Put(':id')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ): Promise<Video> {
    return this.videosService.update(id, updateVideoDto);
  }

  // Suppression - Admin et Manager seulement
  @Delete(':id')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.videosService.remove(id);
    return { message: 'Vidéo supprimée avec succès' };
  }
}