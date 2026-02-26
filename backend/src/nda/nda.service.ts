// backend/src/ndas/ndas.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Nda, NdaDocument, NdaStatus } from './schemas/nda.schema';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NdaPdfService } from './nda-pdf.service';
import { UserRole } from '../users/schemas/user.schema';
import { CreateNdaDto } from './dto/create-nda.dto';
import { UpdateNdaDto } from './dto/update-nda.dto';

@Injectable()
export class NdasService {
  private readonly logger = new Logger(NdasService.name);

  constructor(
    @InjectModel(Nda.name) private ndaModel: Model<NdaDocument>,
    private usersService: UsersService,
    private cloudinaryService: CloudinaryService,
    private ndaPdfService: NdaPdfService,
  ) {}

  /**
   * Générer un NDA pour un utilisateur
   */
  async generateNda(userId: string): Promise<NdaDocument> {
    // 1. Vérifier l'utilisateur
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // 2. Vérifier que l'utilisateur est un collaborateur ou manager
    if (
      user.role !== UserRole.COLLABORATEUR &&
      user.role !== UserRole.MANAGER
    ) {
      throw new BadRequestException(
        'Seuls les collaborateurs et managers peuvent avoir un NDA',
      );
    }

    // 3. Vérifier le profil
    if (!user.profile) {
      throw new BadRequestException("Le profil utilisateur n'est pas défini");
    }

    // 4. Vérifier si un NDA existe déjà (et n'est pas archivé)
    const existingNda = await this.ndaModel.findOne({
      userId: new Types.ObjectId(userId),
      isArchived: false,
    });

    if (existingNda) {
      this.logger.log(`NDA existant trouvé pour l'utilisateur ${userId}`);
      return existingNda;
    }

    // 5. Générer un numéro NDA unique
    // 5. Générer un numéro NDA unique
    const ndaNumber = this.generateNdaNumber();

    // 6. Générer le PDF
    this.logger.log(`Génération du PDF NDA pour l'utilisateur ${userId}`);
    const pdfBuffer = await this.ndaPdfService.generateNda(user, ndaNumber);

    // 7. Nom du fichier PDF
    const fileName = `NDA_${user.nom}_${user.prenoms}.pdf`;

    // 8. Upload vers Cloudinary
    this.logger.log(`Upload du NDA vers Cloudinary: ${fileName}`);
    const { url: pdfUrl, publicId } = await this.cloudinaryService.uploadPdf(
      pdfBuffer,
      fileName,
    );

    this.logger.log(`✅ NDA généré avec succès: ${ndaNumber}`);
    this.logger.log(`📄 URL Cloudinary: ${pdfUrl}`);

    // 9. Gérer correctement expiresAt
    let expiresAt: Date | undefined = undefined;

    if (user.dateFin && !user.dateFinIndeterminee) {
      expiresAt = new Date(user.dateFin);
    }

    // 10. Créer l'enregistrement en base avec ObjectId
    const ndaData = {
      userId: new Types.ObjectId(userId), // ✅ CORRECTION : ObjectId au lieu de string
      ndaNumber,
      pdfUrl,
      publicId,
      fileName,
      status: NdaStatus.GENERATED,
      expiresAt,
    };

    this.logger.log(`💾 Enregistrement du NDA en base pour userId: ${userId}`);
    const nda = new this.ndaModel(ndaData);
    const savedNda = await nda.save();

    this.logger.log(`✅ NDA enregistré avec succès en base: ${savedNda._id}`);
    this.logger.log(`🔍 Vérification: userId dans le NDA = ${savedNda.userId}`);

    return savedNda;
  }

  /**
   * Générer un numéro NDA unique
   * Format: NDA-YYYYMMDD-XXXXX
   */
  private generateNdaNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `NDA-${year}${month}${day}-${random}`;
  }

  /**
   * Récupérer tous les NDAs (admin)
   */
  async findAll(options?: {
    includeArchived?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<NdaDocument[]> {
    const query: any = {};

    if (!options?.includeArchived) {
      query.isArchived = false;
    }

    let dbQuery = this.ndaModel.find(query).sort({ createdAt: -1 });

    if (options?.limit) {
      dbQuery = dbQuery.limit(options.limit);
    }
    if (options?.skip) {
      dbQuery = dbQuery.skip(options.skip);
    }

    return dbQuery.exec();
  }

  /**
   * Récupérer les NDAs d'un utilisateur spécifique
   */
  async findUserNdas(userId: string): Promise<NdaDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    const ndas = await this.ndaModel
      .find({
        userId: new Types.ObjectId(userId),
        isArchived: false,
      })
      .sort({ createdAt: -1 })
      .exec();
    return ndas;
  }

  /**
   * Récupérer un NDA par son ID
   */
  async findById(ndaId: string): Promise<NdaDocument> {
    if (!Types.ObjectId.isValid(ndaId)) {
      throw new BadRequestException('ID NDA invalide');
    }

    const nda = await this.ndaModel.findById(ndaId).exec();
    if (!nda) {
      throw new NotFoundException(`NDA ${ndaId} non trouvé`);
    }
    return nda;
  }

  /**
   * Mettre à jour un NDA
   */
  async update(
    ndaId: string,
    updateNdaDto: UpdateNdaDto,
  ): Promise<NdaDocument> {
    if (!Types.ObjectId.isValid(ndaId)) {
      throw new BadRequestException('ID NDA invalide');
    }

    const updated = await this.ndaModel
      .findByIdAndUpdate(ndaId, updateNdaDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`NDA ${ndaId} non trouvé`);
    }

    return updated;
  }

  /**
   * Supprimer un NDA
   */
  async deleteNda(ndaId: string): Promise<void> {
    const nda = await this.findById(ndaId);

    // Supprimer le fichier de Cloudinary
    try {
      await this.cloudinaryService.deleteFile(nda.publicId);
      this.logger.log(`Fichier Cloudinary supprimé: ${nda.publicId}`);
    } catch (error) {
      this.logger.error(
        `Erreur suppression fichier Cloudinary: ${error.message}`,
      );
      // On continue même si la suppression échoue
    }

    // Supprimer l'enregistrement en base
    await this.ndaModel.findByIdAndDelete(ndaId);
    this.logger.log(`NDA ${ndaId} supprimé de la base`);
  }

  /**
   * Archiver un NDA (soft delete)
   */
  async archiveNda(ndaId: string): Promise<NdaDocument> {
    const nda = await this.findById(ndaId);

    nda.isArchived = true;
    nda.archivedAt = new Date();

    return nda.save();
  }

  /**
   * Restaurer un NDA archivé
   */
  async restoreNda(ndaId: string): Promise<NdaDocument> {
    const nda = await this.findById(ndaId);

    nda.isArchived = false;
    nda.archivedAt = undefined; // CORRECTION: undefined au lieu de null

    return nda.save();
  }

  /**
   * Régénérer un NDA
   */
  async regenerateNda(ndaId: string): Promise<NdaDocument> {
    // 1. Récupérer le NDA existant
    const existingNda = await this.findById(ndaId);

    // 2. Récupérer l'utilisateur
    const user = await this.usersService.findById(
      existingNda.userId.toString(),
    );

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // 3. Archiver l'ancien NDA
    existingNda.isArchived = true;
    existingNda.archivedAt = new Date();
    await existingNda.save();

    // 4. Supprimer l'ancien fichier de Cloudinary
    try {
      await this.cloudinaryService.deleteFile(existingNda.publicId);
    } catch (error) {
      this.logger.warn(`Ancien fichier non supprimé: ${error.message}`);
    }

    // 5. Générer un nouveau numéro
    const ndaNumber = this.generateNdaNumber();

    // 6. Générer le nouveau PDF
    const pdfBuffer = await this.ndaPdfService.generateNda(user, ndaNumber);
    const fileName = `nda_${user.nom}_${user.prenoms}_${ndaNumber}.pdf`;

    // 7. Upload vers Cloudinary
    const { url: pdfUrl, publicId } = await this.cloudinaryService.uploadPdf(
      pdfBuffer,
      fileName,
    );

    // CORRECTION: Gestion correcte de expiresAt
    let expiresAt: Date | undefined = undefined;

    if (user.dateFin && !user.dateFinIndeterminee) {
      expiresAt = new Date(user.dateFin);
    }

    // 8. Créer le nouveau NDA avec version incrémentée
    const newNda = new this.ndaModel({
      userId: user._id,
      ndaNumber,
      pdfUrl,
      publicId,
      fileName,
      status: NdaStatus.GENERATED,
      expiresAt,
      version: (existingNda.version || 0) + 1,
    });

    return newNda.save();
  }

  /**
   * Marquer un NDA comme signé
   */
  async markAsSigned(ndaId: string): Promise<NdaDocument> {
    const nda = await this.findById(ndaId);

    nda.status = NdaStatus.SIGNED;
    nda.signedAt = new Date();

    return nda.save();
  }

  /**
   * Statistiques des NDAs
   */
  async getNdaStats(): Promise<any> {
    const total = await this.ndaModel.countDocuments();
    const generated = await this.ndaModel.countDocuments({
      status: NdaStatus.GENERATED,
    });
    const signed = await this.ndaModel.countDocuments({
      status: NdaStatus.SIGNED,
    });
    const archived = await this.ndaModel.countDocuments({
      isArchived: true,
    });
    const expired = await this.ndaModel.countDocuments({
      status: NdaStatus.EXPIRED,
    });

    // NDAs par mois (12 derniers mois)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const byMonth = await this.ndaModel.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1,
        },
      },
    ]);

    return {
      total,
      generated,
      signed,
      archived,
      expired,
      byMonth,
    };
  }
}
