import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument, ContractType } from './schemas/contract.schema';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PdfService } from './pdf.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    private usersService: UsersService,
    private cloudinaryService: CloudinaryService,
    private pdfService: PdfService,
  ) {}

  async generateContract(userId: string): Promise<ContractDocument> {
    // Récupérer l'utilisateur
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si un contrat existe déjà
    const existingContract = await this.contractModel.findOne({ userId: new Types.ObjectId(userId) });
    if (existingContract) {
      return existingContract;
    }

    // Générer le PDF selon le profil
    let pdfBuffer: Buffer;
    let contractType: ContractType;

    if (user.profile === 'stagiaire') {
      pdfBuffer = await this.pdfService.generateStagiaireContract(user);
      contractType = ContractType.STAGIAIRE;
    } else if (user.profile === 'prestataire') {
      pdfBuffer = await this.pdfService.generatePrestataireContract(user);
      contractType = ContractType.PRESTATAIRE;
    } else {
      throw new Error('Profil utilisateur non supporté');
    }

    // Générer un numéro de contrat unique
    const contractNumber = this.generateContractNumber(contractType);

    // Nom du fichier PDF
    const fileName = `contract_${user.nom}_${user.prenoms}_${contractType}.pdf`;

    // Upload vers Cloudinary en tant que fichier brut
    const { url: pdfUrl, publicId } = await this.cloudinaryService.uploadPdf(pdfBuffer, fileName);

    console.log('✅ Contrat généré avec succès');
    console.log('📄 URL Cloudinary:', pdfUrl);
    console.log('🔢 Numéro contrat:', contractNumber);

    // Créer l'enregistrement en base
    const contractData = {
      userId: user._id,
      type: contractType,
      contractNumber,
      pdfUrl: pdfUrl,
      publicId,
      fileName,
      status: 'generated',
      expiresAt: user.dateFin && !user.dateFinIndeterminee ? new Date(user.dateFin) : undefined,
    };

    const contract = new this.contractModel(contractData);
    return contract.save();
  }

  async getUserContracts(userId: string): Promise<ContractDocument[]> {
    return this.contractModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getContractById(contractId: string): Promise<ContractDocument> {
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }
    return contract;
  }

  async deleteContract(contractId: string): Promise<void> {
    const contract = await this.getContractById(contractId);
    
    // Supprimer le fichier de Cloudinary
    await this.cloudinaryService.deleteFile(contract.publicId);
    
    // Supprimer l'enregistrement en base
    await this.contractModel.findByIdAndDelete(contractId);
  }

  // Régénérer un contrat (en cas d'erreur)
  async regenerateContract(contractId: string): Promise<ContractDocument> {
    const contract = await this.getContractById(contractId);
    
    // Supprimer l'ancien fichier Cloudinary
    await this.cloudinaryService.deleteFile(contract.publicId);
    
    // Régénérer le contrat
    return this.generateContract(contract.userId.toString());
  }

  private generateContractNumber(type: ContractType): string {
    const prefix = type === ContractType.STAGIAIRE ? 'STG' : 'PRS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}