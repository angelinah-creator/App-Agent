import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RendezVousController } from './rendez-vous.controller';
import { RendezVousService } from './rendez-vous.service';
import { RendezVous, RendezVousSchema } from './schemas/rendez-vous.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RendezVous.name, schema: RendezVousSchema },
    ]),
    UsersModule,
  ],
  controllers: [RendezVousController],
  providers: [RendezVousService],
  exports: [RendezVousService],
})
export class RendezVousModule {}