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
      throw new BadRequestException('Une vidéo existe déjà. Veuillez la supprimer avant d\'en uploader une nouvelle.');
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

  async findAll(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<{ videos: Video[]; total: number; pages: number }> {
    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.videoModel
        .find(query)
        .populate('uploadedBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.videoModel.countDocuments(query),
    ]);

    return {
      videos,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoModel
      .findById(id)
      .populate('uploadedBy', 'username email')
      .exec();

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    // Incrémenter le compteur de vues
    await this.videoModel.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return video;
  }

  async getActiveVideo(): Promise<Video | null> {
    return this.videoModel
      .findOne({ isActive: true })
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

  async getVideoThumbnail(id: string): Promise<string> {
    const video = await this.videoModel.findById(id).exec();

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    return this.cloudinaryService.getVideoThumbnail(video.publicId);
  }
}