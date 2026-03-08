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

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Video[]> {
    return this.videosService.findAll();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async findAllAdmin(): Promise<Video[]> {
    return this.videosService.findAllAdmin();
  }

  @Get('my-progress')
  @UseGuards(JwtAuthGuard)
  async getMyProgress(@Req() request: express.Request) {
    const user = request.user as any;
    return this.videosService.getUserProgress(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<Video> {
    return this.videosService.findOne(id);
  }

  @Patch(':id/view')
  @UseGuards(JwtAuthGuard)
  async incrementViews(
    @Param('id') id: string,
    @Req() request: express.Request,
  ): Promise<{ message: string }> {
    const user = request.user as any;
    await this.videosService.incrementViews(id);
    // Marquer comme vue par cet utilisateur
    await this.videosService.markVideoWatched(id, user.userId);
    return { message: 'Vue enregistrée' };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ): Promise<Video> {
    return this.videosService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.videosService.remove(id);
    return { message: 'Vidéo supprimée avec succès' };
  }
}