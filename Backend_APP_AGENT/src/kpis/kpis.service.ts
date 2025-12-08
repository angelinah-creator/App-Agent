import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KPI, KPIDocument, KPIType } from './schemas/kpis.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateKPIDto } from './dto/create-kpi.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class KPIsService {
  constructor(
    @InjectModel(KPI.name) private readonly kpiModel: Model<KPIDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService,
  ) {}

  async uploadKPI(
    userId: string,
    file: Express.Multer.File,
    createKPIDto: CreateKPIDto,
  ): Promise<KPIDocument> {
    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Le fichier est trop volumineux. Taille maximum: 10MB',
      );
    }

    // Vérifier le type MIME
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non supporté. Types autorisés: PDF, DOC, DOCX, XLS, XLSX',
      );
    }

    // Récupérer les informations de l'utilisateur
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Nettoyer le nom et prénom
    const cleanNom = user.nom.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanPrenoms = user.prenoms
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `kpi_rapport_mensuel_${createKPIDto.periode}_${cleanNom}_${cleanPrenoms}.${fileExtension}`;

    try {
      // Upload vers Cloudinary
      const { url: fileUrl, publicId } =
        await this.cloudinaryService.uploadFile(
          file.buffer,
          fileName,
          file.mimetype,
        );

      // Créer le KPI en base - FORCER le type à "rapport_mensuel"
      const kpiData = {
        userId: new Types.ObjectId(userId),
        type: KPIType.RAPPORT_MENSUEL, // FORCÉ à rapport_mensuel
        periode: createKPIDto.periode,
        originalName: file.originalname,
        fileName: fileName,
        fileUrl: fileUrl,
        publicId: publicId,
        mimeType: file.mimetype,
        fileSize: file.size,
        description: createKPIDto.description,
      };

      const kpi = new this.kpiModel(kpiData);
      return await kpi.save();
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de l'upload: ${error.message}`,
      );
    }
  }

  async getUserKPIs(userId: string): Promise<KPIDocument[]> {
    return await this.kpiModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'nom prenoms email profile') // AJOUT du populate
      .sort({ periode: -1, createdAt: -1 })
      .exec();
  }

  async getKPIById(kpiId: string, userId?: string): Promise<KPIDocument> {
    const kpi = await this.kpiModel
      .findById(kpiId)
      .populate('userId', 'nom prenoms email profile') // AJOUT du populate
      .exec();

    if (!kpi) {
      throw new NotFoundException('KPI non trouvé');
    }

    return kpi;
  }

  async deleteKPI(kpiId: string, userId: string): Promise<void> {
    const kpi = await this.getKPIById(kpiId, userId);

    // Supprimer le fichier de Cloudinary
    try {
      await this.cloudinaryService.deleteFile(kpi.publicId);
    } catch (error) {
      console.error('Erreur lors de la suppression Cloudinary:', error);
    }

    // Supprimer le KPI en base
    await this.kpiModel.findByIdAndDelete(kpiId).exec();
  }

  async getKPIsStats(userId: string): Promise<any[]> {
    const stats = await this.kpiModel.aggregate([
      {
        $match: { userId: new Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    return stats;
  }

  /**
   * Admin: Récupérer tous les KPIs de tous les agents avec populate
   */
  async getAllKPIs(filter?: any): Promise<KPIDocument[]> {
    const query = filter || {};
    return await this.kpiModel
      .find(query)
      .populate('userId', 'nom prenoms email profile') // POPULATE CORRECT
      .sort({ periode: -1, createdAt: -1 })
      .exec();
  }

  /**
   * Récupérer les KPIs par période
   */
  async getKPIsByPeriode(periode: string): Promise<KPIDocument[]> {
    return await this.kpiModel
      .find({ periode })
      .populate('userId', 'nom prenoms email profile')
      .sort({ createdAt: -1 })
      .exec();
  }
}