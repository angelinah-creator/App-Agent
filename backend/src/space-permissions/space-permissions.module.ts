import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpacePermissionsController } from './space-permissions.controller';
import { SpacePermissionsService } from './space-permissions.service';
import { SpacePermission, SpacePermissionSchema } from './schemas/space-permission.schema';
import { SpacesModule } from '../spaces/spaces.module'; // AJOUT
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SpacePermission.name, schema: SpacePermissionSchema }]),
    SpacesModule, // IMPORTANT: importer SpacesModule
    UsersModule,
  ],
  controllers: [SpacePermissionsController],
  providers: [SpacePermissionsService],
  exports: [SpacePermissionsService],
})
export class SpacePermissionsModule {}