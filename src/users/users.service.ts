import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserProfile } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const created = new this.userModel(createUserDto);
    return created.save();
  }

  async findAll(includeArchived: boolean = false): Promise<UserDocument[]> {
    if (includeArchived) {
      return this.userModel.find().exec();
    }
    return this.userModel.find({ archived: false }).exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserProfile?: string,
  ): Promise<UserDocument> {
    // Vérifier les restrictions de changement de profil
    if (updateUserDto.profile) {
      await this.validateProfileChange(
        id,
        updateUserDto.profile,
        currentUserProfile,
      );
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException(`User ${id} not found`);
  }

  async findByCin(cin: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ cin }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    return this.findOne(id);
  }

  async findStagiaires(): Promise<UserDocument[]> {
    return this.userModel.find({ profile: 'stagiaire' }).exec();
  }

  async findPrestataires(): Promise<UserDocument[]> {
    return this.userModel.find({ profile: 'prestataire' }).exec();
  }

  async findAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({ profile: 'admin' }).exec();
  }

  async findNonAdmins(): Promise<UserDocument[]> {
    return this.userModel
      .find({ profile: { $in: ['stagiaire', 'prestataire'] } })
      .exec();
  }

  /**
   * Changer le profil d'un utilisateur (nouvelle méthode unifiée)
   * Gestion comple¨te des changements de profil
   */
  async changeUserProfile(
    userId: string,
    newProfile: UserProfile,
    adminId: string,
  ): Promise<UserDocument> {
    // Vérifier que l'utilisateur existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const currentProfile = user.profile;

    // Vérifier que le profil change réellement
    if (currentProfile === newProfile) {
      throw new BadRequestException('Le profil est déje  celui-ci');
    }

    // Vérifier que le nouveau profil est valide
    if (
      newProfile !== UserProfile.ADMIN &&
      newProfile !== UserProfile.STAGIAIRE &&
      newProfile !== UserProfile.PRESTATAIRE
    ) {
      throw new BadRequestException('Profil non valide');
    }

    // Re¨gle 1 : Interdire les changements entre stagiaire et prestataire
    if (
      (currentProfile === UserProfile.STAGIAIRE &&
        newProfile === UserProfile.PRESTATAIRE) ||
      (currentProfile === UserProfile.PRESTATAIRE &&
        newProfile === UserProfile.STAGIAIRE)
    ) {
      throw new BadRequestException(
        'Les changements entre stagiaire et prestataire ne sont pas autorisés',
      );
    }

    // Re¨gle 2 : Si on rétrograde le dernier admin, interdire
    if (
      currentProfile === UserProfile.ADMIN &&
      newProfile !== UserProfile.ADMIN
    ) {
      const adminCount = await this.userModel.countDocuments({
        profile: UserProfile.ADMIN,
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Impossible de modifier le profil du dernier administrateur',
        );
      }
    }

    // Effectuer le changement
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { profile: newProfile }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Utilisateur non trouvé apres mise e  jour');
    }

    return updated;
  }

  /**
   * Méthode pour promouvoir un utilisateur en admin (conservée pour compatibilité)
   */
  async promoteToAdmin(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.profile === UserProfile.ADMIN) {
      throw new BadRequestException('Cet utilisateur est déje  administrateur');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(userId, { profile: UserProfile.ADMIN }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Utilisateur non trouvé apres mise e  jour');
    }

    return updated;
  }

  /**
   * Méthode pour changer le profil d'un admin (conservée pour compatibilité)
   */
  async changeAdminProfile(
    userId: string,
    newProfile: UserProfile,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.profile !== UserProfile.ADMIN) {
      throw new BadRequestException("Cet utilisateur n'est pas administrateur");
    }

    if (newProfile === UserProfile.ADMIN) {
      throw new BadRequestException('Le nouveau profil ne peut pas etre admin');
    }

    if (
      newProfile !== UserProfile.STAGIAIRE &&
      newProfile !== UserProfile.PRESTATAIRE
    ) {
      throw new BadRequestException(
        'Le nouveau profil doit etre stagiaire ou prestataire',
      );
    }

    const adminCount = await this.userModel.countDocuments({
      profile: UserProfile.ADMIN,
    });
    if (adminCount <= 1) {
      throw new BadRequestException(
        'Impossible de modifier le profil du dernier administrateur',
      );
    }

    const updated = await this.userModel
      .findByIdAndUpdate(userId, { profile: newProfile }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Utilisateur non trouvé apre¨s mise e  jour');
    }

    return updated;
  }

  // Validation des changements de profil
  private async validateProfileChange(
    userId: string,
    newProfile: UserProfile,
    currentUserProfile?: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Seul un admin peut changer les profils
    if (currentUserProfile !== UserProfile.ADMIN) {
      throw new ForbiddenException(
        'Seuls les administrateurs peuvent modifier les profils',
      );
    }

    const currentProfile = user.profile;

    // Empecher les changements entre stagiaire et prestataire
    if (
      (currentProfile === UserProfile.STAGIAIRE &&
        newProfile === UserProfile.PRESTATAIRE) ||
      (currentProfile === UserProfile.PRESTATAIRE &&
        newProfile === UserProfile.STAGIAIRE)
    ) {
      throw new BadRequestException(
        'Les changements entre stagiaire et prestataire ne sont pas autorisés',
      );
    }

    // Si promotion en admin, utiliser la méthode dédiée
    if (
      newProfile === UserProfile.ADMIN &&
      currentProfile !== UserProfile.ADMIN
    ) {
      throw new BadRequestException(
        'Utilisez la route dédiée pour promouvoir en admin',
      );
    }

    // Si rétrogradation d'admin, utiliser la méthode dédiée
    if (
      currentProfile === UserProfile.ADMIN &&
      newProfile !== UserProfile.ADMIN
    ) {
      throw new BadRequestException(
        "Utilisez la route dédiée pour modifier le profil d'un administrateur",
      );
    }
  }

  // Statistiques des utilisateurs
  /**
   * Récupérer les statistiques incluant les archives
   */
  async getUserStats(): Promise<any> {
    const stats = await this.userModel.aggregate([
      {
        $group: {
          _id: {
            profile: '$profile',
            archived: '$archived',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await this.userModel.countDocuments();
    const active = await this.userModel.countDocuments({ archived: false });
    const archived = await this.userModel.countDocuments({ archived: true });

    return {
      total,
      active,
      archived,
      byProfileAndStatus: stats,
    };
  }

  // Méthode utilitaire pour extraire l'ID
  private extractUserId(user: any): string {
    if (user instanceof Types.ObjectId) {
      return user.toString();
    }
    if (user && user._id) {
      return user._id.toString();
    }
    if (typeof user === 'string') {
      return user;
    }
    throw new Error("Format d'ID utilisateur invalide");
  }

  /**
   * Archiver un utilisateur au lieu de le supprimer
   */
  async archiveUser(id: string, archiveReason?: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          archived: true,
          archivedAt: new Date(),
          archiveReason: archiveReason || "Archivé par l'administrateur",
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`User ${id} not found after update`);
    }

    return updated;
  }

  /**
   * Restaurer un utilisateur archivé
   */
  async restoreUser(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          archived: false,
          archivedAt: null,
          archiveReason: null,
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`User ${id} not found after update`);
    }

    return updated;
  }

  /**
   * Récupérer uniquement les utilisateurs archivés
   */
  async findArchived(): Promise<UserDocument[]> {
    return this.userModel.find({ archived: true }).exec();
  }
}
