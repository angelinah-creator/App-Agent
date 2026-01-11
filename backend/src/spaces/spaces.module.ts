import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { Space, SpaceSchema } from './schemas/space.schema';
import { SpacePermission, SpacePermissionSchema } from '../space-permissions/schemas/space-permission.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Space.name, schema: SpaceSchema },
      { name: SpacePermission.name, schema: SpacePermissionSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}