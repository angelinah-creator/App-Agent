import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedTasksController } from './shared-tasks.controller';
import { SharedTasksService } from './shared-tasks.service';
import { SharedTask, SharedTaskSchema } from './schemas/shared-task.schema';
import { SpacePermissionsModule } from '../space-permissions/space-permissions.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SharedTask.name, schema: SharedTaskSchema }]),
    SpacePermissionsModule,
    ProjectsModule,
  ],
  controllers: [SharedTasksController],
  providers: [SharedTasksService],
  exports: [SharedTasksService],
})
export class SharedTasksModule {}