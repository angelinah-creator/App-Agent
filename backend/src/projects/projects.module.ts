// backend/src/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectEntity, ProjectSchema } from './schemas/project.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectEntity.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}