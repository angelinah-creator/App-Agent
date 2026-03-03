import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    // Upload vers Cloudinary
    const uploadResult = await this.cloudinaryService.uploadVideo(
      file.buffer,
      `${Date.now()}_${file.originalname}`,
    );

    const video = new this.videoModel({
      ...createVideoDto,
      fileName: file.originalname,
      originalName: file.originalname,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      duration: uploadResult.duration || 0,
      format: uploadResult.format,
      size: file.size,
      uploadedBy: new Types.ObjectId(userId),
      chapters: createVideoDto.chapters || [],
    });

    return video.save();
  }

  async findAll(): Promise<Video[]> {
    return this.videoModel
      .find({ isActive: true })
      .populate('uploadedBy', 'username email nom prenoms')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllAdmin(): Promise<Video[]> {
    return this.videoModel
      .find()
      .populate('uploadedBy', 'username email nom prenoms')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoModel
      .findById(id)
      .populate('uploadedBy', 'username email nom prenoms')
      .exec();

    if (!video) {
      throw new NotFoundException(`Vidéo avec l'ID ${id} introuvable`);
    }

    return video;
  }

  async incrementViews(id: string): Promise<void> {
    await this.videoModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const video = await this.videoModel
      .findByIdAndUpdate(id, updateVideoDto, { new: true })
      .exec();

    if (!video) {
      throw new NotFoundException(`Vidéo avec l'ID ${id} introuvable`);
    }

    return video;
  }

  async remove(id: string): Promise<void> {
    const video = await this.videoModel.findById(id).exec();

    if (!video) {
      throw new NotFoundException(`Vidéo avec l'ID ${id} introuvable`);
    }

    await this.cloudinaryService.deleteVideo(video.publicId);
    await this.videoModel.findByIdAndDelete(id);
  }
}