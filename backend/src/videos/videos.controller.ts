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
  NotFoundException,
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

    // Parser les chapitres depuis la chaîne JSON
    let chapters: ChapterDto[] = [];
    if (body.chapters) {
      try {
        chapters = JSON.parse(body.chapters);
      } catch (error) {
        throw new BadRequestException('Format des chapitres invalide');
      }
    }

    const createVideoDto: CreateVideoDto = {
      title: body.title,
      description: body.description,
      chapters: chapters,
    };

    const user = request.user as any;
    const userId = user.userId;

    return this.videosService.create(createVideoDto, file, userId);
  }

  // Récupérer la vidéo (tout le monde peut lire)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getVideo(): Promise<Video | { message: string }> {
    const video = await this.videosService.getVideo();
    if (!video) {
      return { message: 'Aucune vidéo disponible' };
    }
    return video;
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