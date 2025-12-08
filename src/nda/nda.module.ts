import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NdaController } from './nda.controller';
import { NdaService } from './nda.service';
import { Nda, NdaSchema } from './schemas/nda.schema';
import { UsersModule } from '../users/users.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PdfNdaService } from './pdf-nda.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Nda.name, schema: NdaSchema }]),
    UsersModule,
    CloudinaryModule,
  ],
  controllers: [NdaController],
  providers: [NdaService, PdfNdaService],
  exports: [NdaService],
})
export class NdaModule {}