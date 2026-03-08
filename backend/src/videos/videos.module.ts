import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video, VideoSchema } from './schemas/video.schema';
import { VideoProgress, VideoProgressSchema } from './schemas/video-progress.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: VideoProgress.name, schema: VideoProgressSchema },
    ]),
  ],
  controllers: [VideosController],
  providers: [VideosService, CloudinaryService],
  exports: [VideosService],
})
export class VideosModule {}