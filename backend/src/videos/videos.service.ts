import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Video, VideoDocument } from './schemas/video.schema';
import { VideoProgress, VideoProgressDocument } from './schemas/video-progress.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateVideoDto, UpdateVideoDto } from './dto/create-video.dto';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(VideoProgress.name)
    private videoProgressModel: Model<VideoProgressDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createVideoDto: CreateVideoDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Video> {
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

  // ─── Progression ────────────────────────────────────────────────────────

  /**
   * Marquer une vidéo comme vue par un utilisateur
   */
  async markVideoWatched(videoId: string, userId: string): Promise<void> {
    await this.videoProgressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        videoId: new Types.ObjectId(videoId),
      },
      {
        watched: true,
        watchedAt: new Date(),
      },
      { upsert: true, new: true },
    );
  }

  /**
   * Récupérer la progression d'un utilisateur
   * Retourne { watchedCount, totalCount, percentage, watchedVideoIds }
   */
  async getUserProgress(userId: string): Promise<{
  watchedCount: number;
  totalCount: number;
  percentage: number;
  watchedVideoIds: string[];
}> {
  const totalCount = await this.videoModel.countDocuments({ isActive: true });

  const watchedRecords = await this.videoProgressModel
    .find({
      userId: new Types.ObjectId(userId),
      watched: true,
    })
    .exec();

  const activeVideos = await this.videoModel
    .find({ isActive: true })
    .select('_id')
    .exec();

  // Cast explicite pour résoudre l'erreur "unknown"
  const activeIds = new Set(
    activeVideos.map((v) => (v._id as Types.ObjectId).toString())
  );

  const validWatched = watchedRecords.filter((r) =>
    activeIds.has((r.videoId as Types.ObjectId).toString()),
  );

  const watchedCount = validWatched.length;
  const percentage =
    totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;

  return {
    watchedCount,
    totalCount,
    percentage,
    watchedVideoIds: validWatched.map((r) =>
      (r.videoId as Types.ObjectId).toString()
    ),
  };
}
}