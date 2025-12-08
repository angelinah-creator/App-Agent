import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract, ContractSchema } from './schemas/contract.schema';
import { UsersModule } from '../users/users.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; // Remplacer Firebase
import { PdfService } from './pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contract.name, schema: ContractSchema }]),
    UsersModule,
    CloudinaryModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService, PdfService],
  exports: [ContractsService],
})
export class ContractsModule {}