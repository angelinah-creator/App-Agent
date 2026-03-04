import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RendezVous, RendezVousDocument } from './schemas/rendez-vous.schema';
import { CreateRendezVousDto } from './dto/create-rendez-vous.dto';
import { UpdateRendezVousDto } from './dto/update-rendez-vous.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class RendezVousService {
  constructor(
    @InjectModel(RendezVous.name)
    private rendezVousModel: Model<RendezVousDocument>,
    private usersService: UsersService,
  ) {}

  async create(
    userId: string,
    userRole: string,
    dto: CreateRendezVousDto,
  ): Promise<RendezVousDocument> {
    if (userRole !== 'admin' && userRole !== 'manager') {
      throw new ForbiddenException(
        'Seuls les admins et managers peuvent ajouter un lien Calendly',
      );
    }

    // Récupérer nom/prenoms depuis la BDD
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const existing = await this.rendezVousModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (existing) {
      throw new BadRequestException(
        'Vous avez déjà un lien Calendly. Veuillez le modifier.',
      );
    }

    const created = new this.rendezVousModel({
      userId: new Types.ObjectId(userId),
      nom: user.nom,
      prenoms: user.prenoms,
      role: userRole,
      lienCalendly: dto.lienCalendly,
      description: dto.description,
    });

    return created.save();
  }

  async findAll(): Promise<any[]> {
    const links = await this.rendezVousModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();

    // Enrichir chaque lien avec la photo à jour
    const enriched = await Promise.all(
      links.map(async (link) => {
        const user = await this.usersService.findOne(link.userId.toString());
        const obj = link.toObject();
        return {
          ...obj,
          profilePhoto: user?.profilePhoto || null,
        };
      }),
    );

    return enriched;
  }

  async findMyLink(userId: string): Promise<RendezVousDocument | null> {
    return this.rendezVousModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateRendezVousDto,
  ): Promise<RendezVousDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID invalide');
    }

    const link = await this.rendezVousModel.findById(id);
    if (!link) throw new NotFoundException('Lien non trouvé');

    const isOwner = link.userId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre lien',
      );
    }

    const updated = await this.rendezVousModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated)
      throw new NotFoundException('Lien non trouvé après mise à jour');
    return updated;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID invalide');
    }

    const link = await this.rendezVousModel.findById(id);
    if (!link) throw new NotFoundException('Lien non trouvé');

    const isOwner = link.userId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que votre propre lien',
      );
    }

    await this.rendezVousModel.findByIdAndDelete(id).exec();
  }
}
