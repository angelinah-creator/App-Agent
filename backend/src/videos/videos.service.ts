import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Video, VideoDocument } from './schemas/video.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateVideoDto, UpdateVideoDto } from './dto/create-video.dto';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createVideoDto: CreateVideoDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Video> {
    // Vérifier s'il existe déjà une vidéo
    const existingVideo = await this.videoModel.findOne().exec();
    if (existingVideo) {
      // Supprimer l'ancienne vidéo de Cloudinary
      await this.cloudinaryService.deleteVideo(existingVideo.publicId);
      // Supprimer l'ancienne vidéo de la base
      await this.videoModel.findByIdAndDelete(existingVideo._id);
    }

    // Upload vers Cloudinary
    const uploadResult = await this.cloudinaryService.uploadVideo(
      file.buffer,
      file.originalname,
    );

    // Créer l'entrée en base de données
    const video = new this.videoModel({
      ...createVideoDto,
      fileName: file.originalname,
      originalName: file.originalname,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      duration: uploadResult.duration,
      format: uploadResult.format,
      size: file.size,
      uploadedBy: new Types.ObjectId(userId),
      chapters: createVideoDto.chapters || [],
    });

    return video.save();
  }

  async getVideo(): Promise<Video | null> {
    return this.videoModel
      .findOne()
      .populate('uploadedBy', 'username email')
      .exec();
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const video = await this.videoModel
      .findByIdAndUpdate(id, updateVideoDto, { new: true })
      .exec();

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    return video;
  }

  async remove(id: string): Promise<void> {
    const video = await this.videoModel.findById(id).exec();

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    // Supprimer de Cloudinary
    await this.cloudinaryService.deleteVideo(video.publicId);

    // Supprimer de la base de données
    await this.videoModel.findByIdAndDelete(id);
  }
}