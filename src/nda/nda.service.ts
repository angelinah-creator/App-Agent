import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Nda, NdaDocument } from './schemas/nda.schema';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PdfNdaService } from './pdf-nda.service';

@Injectable()
export class NdaService {
  constructor(
    @InjectModel(Nda.name) private ndaModel: Model<NdaDocument>,
    private usersService: UsersService,
    private cloudinaryService: CloudinaryService,
    private pdfNdaService: PdfNdaService,
  ) {}

  async generateNda(userId: string): Promise<NdaDocument> {
    // Récupérer l'utilisateur
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si un NDA existe déjà
    const existingNda = await this.ndaModel.findOne({ 
      userId: new Types.ObjectId(userId) 
    });
    
    if (existingNda) {
      return existingNda;
    }

    // Générer le PDF NDA
    const pdfBuffer = await this.pdfNdaService.generateNda(user);

    // Générer un numéro de NDA unique
    const ndaNumber = this.generateNdaNumber();

    // Nom du fichier PDF
    const fileName = `nda_${user.nom}_${user.prenoms}_${Date.now()}.pdf`;

    // Upload vers Cloudinary
    const { url: pdfUrl, publicId } = await this.cloudinaryService.uploadPdf(pdfBuffer, fileName);

    console.log('✅ NDA généré avec succès');
    console.log('📄 URL Cloudinary:', pdfUrl);
    console.log('🔢 Numéro NDA:', ndaNumber);

    // Créer l'enregistrement en base
    const nda = new this.ndaModel({
      userId: user._id,
      ndaNumber,
      pdfUrl,
      publicId,
      fileName,
      status: 'generated',
    });

    return nda.save();
  }

  async getUserNda(userId: string): Promise<NdaDocument | null> {
    return this.ndaModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async getNdaById(ndaId: string): Promise<NdaDocument> {
    if (!Types.ObjectId.isValid(ndaId)) {
      throw new NotFoundException('ID NDA invalide');
    }

    const nda = await this.ndaModel.findById(ndaId).exec();
    if (!nda) {
      throw new NotFoundException('NDA non trouvé');
    }
    return nda;
  }

  async deleteNda(ndaId: string): Promise<void> {
    const nda = await this.getNdaById(ndaId);
    
    // Supprimer le fichier de Cloudinary
    await this.cloudinaryService.deleteFile(nda.publicId);
    
    // Supprimer l'enregistrement en base
    await this.ndaModel.findByIdAndDelete(ndaId);
  }

  // Régénérer un NDA (après suppression)
  async regenerateNda(userId: string): Promise<NdaDocument> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Supprimer l'ancien NDA s'il existe
    const existingNda = await this.ndaModel.findOne({ 
      userId: new Types.ObjectId(userId) 
    });
    
    if (existingNda) {
      // Utiliser l'ObjectId directement
      await this.ndaModel.findByIdAndDelete(existingNda._id);
      
      // Supprimer le fichier Cloudinary
      await this.cloudinaryService.deleteFile(existingNda.publicId);
    }

    // Générer un nouveau NDA
    return this.generateNda(userId);
  }

  // Méthode utilitaire pour convertir un ObjectId en string
  private toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  }

  // Méthode utilitaire pour convertir en string
  private toStringId(id: string | Types.ObjectId): string {
    return typeof id === 'string' ? id : id.toString();
  }

  private generateNdaNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `NDA-${timestamp}-${random}`;
  }
}