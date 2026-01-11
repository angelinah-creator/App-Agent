import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonalTasksController } from './personal-tasks.controller';
import { PersonalTasksService } from './personal-tasks.service';
import { PersonalTask, PersonalTaskSchema } from './schemas/personal-task.schema';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PersonalTask.name, schema: PersonalTaskSchema }]),
    UsersModule,
    ProjectsModule,
  ],
  controllers: [PersonalTasksController],
  providers: [PersonalTasksService],
  exports: [PersonalTasksService],
})
export class PersonalTasksModule {}