// backend/src/invoices/invoices.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Invoice,
  InvoiceDocument,
  InvoiceStatus,
} from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private cloudinaryService: CloudinaryService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async createInvoice(
    agentId: string,
    createInvoiceDto: CreateInvoiceDto,
    file: Express.Multer.File,
  ): Promise<InvoiceDocument> {
    // Vérifier si une facture existe déjà pour ce mois/année/agent
    const existingInvoice = await this.invoiceModel.findOne({
      agentId: new Types.ObjectId(agentId),
      month: createInvoiceDto.month,
      year: createInvoiceDto.year,
    });

    if (existingInvoice) {
      throw new BadRequestException(
        'Une facture existe déjà pour ce mois et cette année',
      );
    }

    // Vérifier la référence unique
    const existingReference = await this.invoiceModel.findOne({
      reference: createInvoiceDto.reference,
    });

    if (existingReference) {
      throw new BadRequestException('Cette référence de facture existe déjà');
    }

    // Vérifier le type de fichier
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Seuls les fichiers PDF sont acceptés');
    }

    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Le fichier est trop volumineux. Taille maximum: 10MB',
      );
    }

    // Récupérer les informations de l'agent
    const agent = await this.usersService.findById(agentId);
    if (!agent) {
      throw new NotFoundException('Agent non trouvé');
    }

    // Générer le nom du fichier
    const cleanNom = agent.nom.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanPrenoms = agent.prenoms
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const fileName = `facture_${createInvoiceDto.reference}_${cleanNom}_${cleanPrenoms}.pdf`;

    try {
      // Upload vers Cloudinary
      const { url: pdfUrl, publicId } = await this.cloudinaryService.uploadPdf(
        file.buffer,
        fileName,
      );

      // Créer la facture en base
      const invoiceData = {
        agentId: new Types.ObjectId(agentId),
        month: createInvoiceDto.month,
        year: createInvoiceDto.year,
        reference: createInvoiceDto.reference,
        pdfUrl,
        publicId,
        fileName,
        status: InvoiceStatus.PENDING,
      };

      const invoice = new this.invoiceModel(invoiceData);
      const savedInvoice = await invoice.save();

      // Notifier les admins
      await this.notifyAdminsAboutNewInvoice(savedInvoice);

      return savedInvoice;
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors de l'upload: ${error.message}`,
      );
    }
  }

  async updateInvoice(
    invoiceId: string,
    adminId: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel
      .findById(invoiceId)
      .populate('agentId', 'nom prenoms email profile')
      .exec();

    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }

    const updateData: any = {
      processedBy: new Types.ObjectId(adminId),
      processedAt: new Date(),
    };

    if (updateInvoiceDto.amount !== undefined) {
      updateData.amount = updateInvoiceDto.amount;
    }

    if (updateInvoiceDto.paymentDate) {
      updateData.paymentDate = new Date(updateInvoiceDto.paymentDate);
    }

    if (updateInvoiceDto.transferReference) {
      updateData.transferReference = updateInvoiceDto.transferReference;
    }

    if (updateInvoiceDto.status) {
      updateData.status = updateInvoiceDto.status;
    }

    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(invoiceId, updateData, { new: true })
      .populate('agentId', 'nom prenoms email profile')
      .populate('processedBy', 'nom prenoms')
      .exec();

    // Notifier l'agent du changement de statut
    await this.notifyAgentAboutInvoiceUpdate(updatedInvoice!);

    return updatedInvoice!;
  }

  async getAgentInvoices(agentId: string): Promise<InvoiceDocument[]> {
    return this.invoiceModel
      .find({ agentId: new Types.ObjectId(agentId) })
      .populate('processedBy', 'nom prenoms')
      .sort({ year: -1, month: -1 })
      .exec();
  }

  async getAllInvoices(): Promise<InvoiceDocument[]> {
    return this.invoiceModel
      .find()
      .populate('agentId', 'nom prenoms email profile')
      .populate('processedBy', 'nom prenoms')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .exec();
  }

  async getInvoiceById(invoiceId: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel
      .findById(invoiceId)
      .populate('agentId', 'nom prenoms email profile')
      .populate('processedBy', 'nom prenoms')
      .exec();

    if (!invoice) {
      throw new NotFoundException('Facture non trouvée');
    }

    return invoice;
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.getInvoiceById(invoiceId);

    // Supprimer le fichier de Cloudinary
    try {
      await this.cloudinaryService.deleteFile(invoice.publicId);
    } catch (error) {
      console.error('Erreur lors de la suppression Cloudinary:', error);
    }

    // Supprimer la facture en base
    await this.invoiceModel.findByIdAndDelete(invoiceId).exec();
  }

  async getInvoicesByMonthYear(
    month: number,
    year: number,
  ): Promise<InvoiceDocument[]> {
    return this.invoiceModel
      .find({ month, year })
      .populate('agentId', 'nom prenoms email profile')
      .exec();
  }

  // Dans backend/src/invoices/invoices.service.ts - AJOUTEZ ces méthodes

  private async notifyAdminsAboutNewInvoice(
    invoice: InvoiceDocument,
  ): Promise<void> {
    try {
      // Récupérer tous les admins
      const admins = await this.usersService.findAdmins();

      // Récupérer les informations complètes de l'agent
      const agentId = this.extractUserId(invoice.agentId);
      const agent = await this.usersService.findById(agentId);
      const agentName = agent
        ? `${agent.prenoms} ${agent.nom}`
        : 'Un prestataire';

      // Notification dans l'application
      for (const admin of admins) {
        const adminId = this.extractUserId(admin._id);
        const invoiceId = this.extractUserId(invoice._id);

        await this.notificationsService.createNotification(
          adminId,
          NotificationType.INVOICE_CREATED,
          'Nouvelle facture reçue',
          `${agentName} a soumis une facture pour ${this.getMonthName(invoice.month)} ${invoice.year} (Réf: ${invoice.reference})`,
          undefined,
          invoiceId,
        );
      }

      // ENVOI D'EMAIL aux admins
      await this.mailService.notifyAdminsNewInvoice(admins, invoice, agentName);
    } catch (error) {
      console.error('Erreur lors de la notification des admins:', error);
    }
  }

  private async notifyAgentAboutInvoiceUpdate(
    invoice: InvoiceDocument,
  ): Promise<void> {
    try {
      let title = '';
      let message = '';

      const agentId = this.extractUserId(invoice.agentId);
      const invoiceId = this.extractUserId(invoice._id);
      const agent = await this.usersService.findById(agentId);

      if (invoice.status === InvoiceStatus.PAID) {
        title = 'Facture payée';
        message = `Votre facture ${invoice.reference} pour ${this.getMonthName(invoice.month)} ${invoice.year} a été payée.`;

        if (invoice.amount) {
          message += ` Montant: ${invoice.amount}`;
        }
        if (invoice.transferReference) {
          message += ` Référence virement: ${invoice.transferReference}`;
        }
        if (invoice.paymentDate) {
          message += ` Date paiement: ${this.formatDate(invoice.paymentDate)}`;
        }
      } else if (invoice.status === InvoiceStatus.UNPAID) {
        title = 'Facture non payée';
        message = `Votre facture ${invoice.reference} pour ${this.getMonthName(invoice.month)} ${invoice.year} a été marquée comme non payée.`;
      }

      if (title && message) {
        // Notification dans l'application
        await this.notificationsService.createNotification(
          agentId,
          this.getNotificationTypeForInvoiceStatus(invoice.status),
          title,
          message,
          undefined,
          invoiceId,
        );

        // ENVOI D'EMAIL à l'agent
        if (agent) {
          await this.mailService.notifyAgentInvoiceStatus(
            agent,
            invoice,
            invoice.status,
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la notification de l'agent:", error);
    }
  }

  // Méthodes utilitaires - AJOUTEZ à la fin de la classe
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

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }

  private getMonthName(month: number): string {
    const months = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    return months[month - 1] || 'Mois inconnu';
  }

  private getNotificationTypeForInvoiceStatus(
    status: InvoiceStatus,
  ): NotificationType {
    switch (status) {
      case InvoiceStatus.PAID:
        return NotificationType.INVOICE_PAID;
      case InvoiceStatus.UNPAID:
        return NotificationType.INVOICE_OVERDUE; // Ou créez INVOICE_UNPAID si vous préférez
      default:
        return NotificationType.INVOICE_CREATED;
    }
  }

  private extractUserName(user: any): string {
    if (user && user.nom && user.prenoms) {
      return `${user.nom} ${user.prenoms}`;
    }
    if (typeof user === 'string') {
      return 'Utilisateur';
    }
    return 'Utilisateur inconnu';
  }
}
