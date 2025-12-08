import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KPIsController } from './kpis.controller';
import { KPIsService } from './kpis.service';
import { KPI, KPISchema } from './schemas/kpis.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: KPI.name, schema: KPISchema }]),
    CloudinaryModule,
    UsersModule,
  ],
  controllers: [KPIsController],
  providers: [KPIsService],
  exports: [KPIsService],
})
export class KPIsModule {}