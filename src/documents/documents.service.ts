import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument, DocumentType } from './schemas/document.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UsersService } from '../users/users.service'; // AJOUT

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    private cloudinaryService: CloudinaryService,
    private usersService: UsersService, // AJOUT
  ) {}

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentDocument> {
    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Le fichier est trop volumineux. Taille maximum: 10MB');
    }

    // Vérifier le type MIME
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non supporté. Types autorisés: JPEG, PNG, GIF, PDF, DOC, DOCX');
    }

    // Récupérer les informations de l'utilisateur
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Nettoyer le nom et prénom pour le fichier
    const cleanNom = user.nom.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanPrenoms = user.prenoms.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    // Générer un nom de fichier unique avec nom et prénom
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    // const fileName = `document_${createDocumentDto.type}_${cleanNom}_${cleanPrenoms}_${timestamp}.${fileExtension}`;
    const fileName = `document_${createDocumentDto.type}_${cleanNom}_${cleanPrenoms}.${fileExtension}`;

    try {
      // Upload vers Cloudinary
      const { url: fileUrl, publicId } = await this.cloudinaryService.uploadFile(
        file.buffer,
        fileName,
        file.mimetype
      );

      // Créer le document en base
      const documentData = {
        userId: new Types.ObjectId(userId),
        type: createDocumentDto.type,
        originalName: file.originalname,
        fileName: fileName,
        fileUrl: fileUrl,
        publicId: publicId,
        mimeType: file.mimetype,
        fileSize: file.size,
        description: createDocumentDto.description,
      };

      const document = new this.documentModel(documentData);
      return document.save();

    } catch (error) {
      throw new BadRequestException(`Erreur lors de l'upload: ${error.message}`);
    }
  }

  async getUserDocuments(userId: string): Promise<DocumentDocument[]> {
    return this.documentModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserDocumentsByType(userId: string, type: DocumentType): Promise<DocumentDocument[]> {
    return this.documentModel
      .find({ 
        userId: new Types.ObjectId(userId),
        type: type 
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getDocumentById(documentId: string, userId?: string): Promise<DocumentDocument> {
    const document = await this.documentModel.findById(documentId).exec();
    
    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    // Vérifier que l'utilisateur peut accéder au document
    if (userId && document.userId.toString() !== userId) {
      throw new ForbiddenException('Accès non autorisé à ce document');
    }

    return document;
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.getDocumentById(documentId, userId);

    // Supprimer le fichier de Cloudinary
    try {
      await this.cloudinaryService.deleteFile(document.publicId);
    } catch (error) {
      console.error('Erreur lors de la suppression Cloudinary:', error);
      // Continuer quand même avec la suppression en base
    }

    // Supprimer le document en base
    await this.documentModel.findByIdAndDelete(documentId).exec();
  }

  async getDocumentsStats(userId: string) {
    const stats = await this.documentModel.aggregate([
      {
        $match: { userId: new Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        }
      }
    ]);

    return stats;
  }

  // Méthode pour l'administration - récupérer tous les documents
  async getAllDocuments(filter?: any): Promise<DocumentDocument[]> {
    const query = filter || {};
    return this.documentModel
      .find(query)
      .populate('userId', 'nom prenoms email')
      .populate('validatedBy', 'nom prenoms')
      .sort({ createdAt: -1 })
      .exec();
  }
}