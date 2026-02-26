// backend/src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
  UserRole,
  UserProfile,
} from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import bcrypt from 'node_modules/bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserRole?: string,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    // Vérifier les restrictions de changement de rôle
    if (updateUserDto.role) {
      await this.validateRoleChange(id, updateUserDto.role, currentUserRole);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }
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

  // Méthodes pour trouver par rôle
  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userModel.find({ role }).exec();
  }

  async findAdmins(): Promise<UserDocument[]> {
    return this.findByRole(UserRole.ADMIN);
  }

  async findCollaborateurs(): Promise<UserDocument[]> {
    return this.findByRole(UserRole.COLLABORATEUR);
  }

  async findManagers(): Promise<UserDocument[]> {
    return this.findByRole(UserRole.MANAGER);
  }

  async findClients(): Promise<UserDocument[]> {
    return this.findByRole(UserRole.CLIENT);
  }

  // Méthodes pour trouver par profil (uniquement collaborateurs et managers)
  async findStagiaires(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        profile: UserProfile.STAGIAIRE,
        role: { $in: [UserRole.COLLABORATEUR, UserRole.MANAGER] },
      })
      .exec();
  }

  async findPrestataires(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        profile: UserProfile.PRESTATAIRE,
        role: { $in: [UserRole.COLLABORATEUR, UserRole.MANAGER] },
      })
      .exec();
  }

  async findNonAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({ role: { $ne: UserRole.ADMIN } }).exec();
  }

  /**
   * Changer le profil d'un collaborateur/manager
   */
  async changeUserProfile(
    userId: string,
    newProfile: UserProfile,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que l'utilisateur est un collaborateur ou manager
    if (
      user.role !== UserRole.COLLABORATEUR &&
      user.role !== UserRole.MANAGER
    ) {
      throw new BadRequestException(
        'Seuls les collaborateurs et managers peuvent avoir un profil',
      );
    }

    const currentProfile = user.profile;

    // Vérifier que le profil change réellement
    if (currentProfile === newProfile) {
      throw new BadRequestException('Le profil est déjà celui-ci');
    }

    // Vérifier que le nouveau profil est valide
    if (!Object.values(UserProfile).includes(newProfile)) {
      throw new BadRequestException('Profil non valide');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(userId, { profile: newProfile }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Utilisateur non trouvé après mise à jour');
    }

    return updated;
  }

  /**
   * Méthode pour promouvoir un utilisateur en admin
   */
  async promoteToAdmin(userId: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cet utilisateur est déjà administrateur');
    }

    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          role: UserRole.ADMIN,
          profile: undefined, // Les admins n'ont pas de profil
          completedProfile: true,
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Utilisateur non trouvé après mise à jour');
    }

    return updated;
  }

  // Validation des changements de rôle
  private async validateRoleChange(
    userId: string,
    newRole: UserRole,
    currentUserRole?: string,
  ): Promise<void> {
    // Seul un admin peut changer les rôles
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Seuls les administrateurs peuvent modifier les rôles',
      );
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const currentRole = user.role;

    // Si promotion en admin, utiliser la méthode dédiée
    if (newRole === UserRole.ADMIN) {
      throw new BadRequestException(
        'Utilisez la route dédiée pour promouvoir en admin',
      );
    }

    // Si rétrogradation d'admin, vérifier que ce n'est pas le dernier admin
    if (currentRole === UserRole.ADMIN) {
      const adminCount = await this.userModel.countDocuments({
        role: UserRole.ADMIN,
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Impossible de modifier le rôle du dernier administrateur',
        );
      }
    }
  }

  // Statistiques des utilisateurs
  async getUserStats(): Promise<any> {
    const stats = await this.userModel.aggregate([
      {
        $group: {
          _id: {
            role: '$role',
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

    // Statistiques par rôle
    const byRole = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // Statistiques par profil (uniquement collaborateurs/managers)
    const byProfile = await this.userModel.aggregate([
      {
        $match: {
          role: { $in: [UserRole.COLLABORATEUR, UserRole.MANAGER] },
          profile: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$profile',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total,
      active,
      archived,
      byRole,
      byProfile,
      byRoleProfileAndStatus: stats,
    };
  }

  /**
   * Mettre à jour le profil client
   */
  async updateClientProfile(
    userId: string,
    profileData: any,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.role !== UserRole.CLIENT) {
      throw new BadRequestException(
        'Seuls les clients peuvent mettre à jour leur profil',
      );
    }

    const updateData = {
      ...profileData,
      completedProfile: true,
    };

    const updated = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Utilisateur non trouvé après mise à jour');
    }

    return updated;
  }

  /**
   * Uploader une photo de profil
   */
  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer l'ancienne photo si elle existe
    if (user.profilePhoto?.publicId) {
      try {
        await this.cloudinaryService.deleteImage(user.profilePhoto.publicId);
      } catch (error) {
        console.error('Erreur suppression ancienne photo:', error);
      }
    }

    // Uploader la nouvelle photo
    const uploadResult = await this.cloudinaryService.uploadImage(
      file.buffer,
      `profile_${userId}_${Date.now()}`,
      'agent_code_talent/profile_photos',
    );

    // Mettre à jour l'utilisateur
    user.profilePhoto = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    };

    return user.save();
  }

  /**
   * Supprimer la photo de profil
   */
  async deleteProfilePhoto(userId: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.profilePhoto?.publicId) {
      throw new BadRequestException('Aucune photo de profil trouvée');
    }

    // Supprimer de Cloudinary
    await this.cloudinaryService.deleteImage(user.profilePhoto.publicId);

    // Supprimer la référence dans l'utilisateur
    user.profilePhoto = undefined;

    return user.save();
  }

  /**
   * Uploader une signature
   */
  async uploadSignature(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer l'ancienne signature si elle existe
    if (user.signature?.publicId) {
      try {
        await this.cloudinaryService.deleteImage(user.signature.publicId);
      } catch (error) {
        console.error('Erreur suppression ancienne signature:', error);
      }
    }

    // Uploader la nouvelle signature
    const uploadResult = await this.cloudinaryService.uploadSignature(
      file.buffer,
      `signature_${userId}_${Date.now()}`,
      'agent_code_talent/signatures',
    );

    // Mettre à jour l'utilisateur
    user.signature = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    };

    return user.save();
  }

  /**
   * Mettre à jour les informations personnelles
   */
  async updatePersonalInfo(
    userId: string,
    updateData: {
      nom?: string;
      prenoms?: string;
      email?: string;
      telephone?: string;
      profilePhoto?: any;
    },
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const updateFields: any = {};

    // Gérer les champs textuels
    if (updateData.nom) updateFields.nom = updateData.nom;
    if (updateData.prenoms) updateFields.prenoms = updateData.prenoms;
    if (updateData.email) updateFields.email = updateData.email;
    if (updateData.telephone) updateFields.telephone = updateData.telephone;

    // Si un fichier photo est fourni, l'uploader
    if (updateData.profilePhoto) {
      const user = await this.userModel.findById(userId);

      // Supprimer l'ancienne photo si elle existe
      if (user?.profilePhoto?.publicId) {
        try {
          await this.cloudinaryService.deleteImage(user.profilePhoto.publicId);
        } catch (error) {
          console.error('Erreur suppression ancienne photo:', error);
        }
      }

      // Uploader la nouvelle photo
      const uploadResult = await this.cloudinaryService.uploadImage(
        updateData.profilePhoto.buffer,
        `profile_${userId}_${Date.now()}`,
        'agent_code_talent/profile_photos',
      );

      updateFields.profilePhoto = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      };
    }

    const updated = await this.userModel
      .findByIdAndUpdate(userId, updateFields, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Utilisateur non trouvé après mise à jour');
    }

    return updated;
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const user = await this.userModel.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    user.password = hashedPassword;
    await user.save();
  }

  /**
   * Archiver un utilisateur au lieu de le supprimer
   */
  async archiveUser(id: string, archiveReason?: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

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

  /**
   * Rechercher des utilisateurs avec filtres
   */
  async searchUsers(filters: {
    role?: UserRole;
    profile?: UserProfile;
    searchTerm?: string;
    archived?: boolean;
  }): Promise<UserDocument[]> {
    const query: any = {};

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.profile) {
      query.profile = filters.profile;
    }

    if (filters.archived !== undefined) {
      query.archived = filters.archived;
    }

    if (filters.searchTerm) {
      query.$or = [
        { nom: { $regex: filters.searchTerm, $options: 'i' } },
        { prenoms: { $regex: filters.searchTerm, $options: 'i' } },
        { email: { $regex: filters.searchTerm, $options: 'i' } },
        { entreprise: { $regex: filters.searchTerm, $options: 'i' } },
      ];
    }

    return this.userModel.find(query).exec();
  }
}
