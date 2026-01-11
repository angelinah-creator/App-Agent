import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseIntPipe,
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

  // Récupérer la vidéo active
  @Get('active/video')
  @UseGuards(JwtAuthGuard)
  async getActiveVideo(): Promise<Video> {
    const video = await this.videosService.getActiveVideo();
    if (!video) {
      throw new NotFoundException('Aucune vidéo active trouvée');
    }
    return video;
  }

  // Consultation - Public (tous les utilisateurs connectés)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('active') active?: string,
  ) {
    const isActive =
      active === 'true' ? true : active === 'false' ? false : undefined;
    return this.videosService.findAll(page, limit, isActive);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async findActiveVideos(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.videosService.findAll(page, limit, true);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<Video> {
    return this.videosService.findOne(id);
  }

  @Get(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  async getThumbnail(
    @Param('id') id: string,
  ): Promise<{ thumbnailUrl: string }> {
    const thumbnailUrl = await this.videosService.getVideoThumbnail(id);
    return { thumbnailUrl };
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
