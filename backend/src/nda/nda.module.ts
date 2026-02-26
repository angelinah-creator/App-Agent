// backend/src/ndas/ndas.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NdasController } from './nda.controller';
import { NdasService } from './nda.service';
import { Nda, NdaSchema } from './schemas/nda.schema';
import { NdaPdfService } from './nda-pdf.service';
import { UsersModule } from '../users/users.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Nda.name, schema: NdaSchema }]),
    UsersModule,
    CloudinaryModule,
  ],
  controllers: [NdasController],
  providers: [NdasService, NdaPdfService],
  exports: [NdasService],
})
export class NdasModule {}