// backend/src/absences/absences.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Absence,
  AbsenceDocument,
  AbsenceStatus,
} from './schemas/absence.schema';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AbsencesService {
  constructor(
    @InjectModel(Absence.name) private absenceModel: Model<AbsenceDocument>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async createAbsence(
    agentId: string,
    createAbsenceDto: CreateAbsenceDto,
  ): Promise<AbsenceDocument> {
    // Vérifier les dates
    const startDate = new Date(createAbsenceDto.startDate);
    const endDate = new Date(createAbsenceDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La date de fin doit être après la date de début',
      );
    }

    if (startDate < new Date()) {
      throw new BadRequestException(
        'La date de début ne peut pas être dans le passé',
      );
    }

    // Vérifier les chevauchements
    const overlappingAbsence = await this.absenceModel.findOne({
      agentId: new Types.ObjectId(agentId),
      status: { $in: [AbsenceStatus.PENDING, AbsenceStatus.APPROVED] },
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });

    if (overlappingAbsence) {
      throw new BadRequestException(
        'Vous avez déjà une absence sur cette période',
      );
    }

    // Créer l'absence
    const absenceData = {
      agentId: new Types.ObjectId(agentId),
      startDate,
      endDate,
      reason: createAbsenceDto.reason,
      backupPerson: createAbsenceDto.backupPerson,
      status: AbsenceStatus.PENDING,
    };

    const absence = new this.absenceModel(absenceData);
    const savedAbsence = await absence.save();

    // Notifier les admins
    await this.notifyAdminsAboutNewAbsence(savedAbsence);

    return savedAbsence;
  }

  // Dans la méthode updateAbsenceStatus, modifier la validation :

  async updateAbsenceStatus(
    absenceId: string,
    adminId: string,
    updateAbsenceDto: UpdateAbsenceDto,
  ): Promise<AbsenceDocument> {
    const absence = await this.absenceModel
      .findById(absenceId)
      .populate('agentId', 'nom prenoms email')
      .exec();

    if (!absence) {
      throw new NotFoundException("Demande d'absence non trouvée");
    }

    // SUPPRIMER la validation obligatoire du adminReason pour les rejets
    // Le champ est maintenant optionnel dans tous les cas

    const updateData: any = {
      validatedBy: new Types.ObjectId(adminId),
      validatedAt: new Date(),
    };

    if (updateAbsenceDto.status) {
      updateData.status = updateAbsenceDto.status;
    }

    if (updateAbsenceDto.adminReason) {
      updateData.adminReason = updateAbsenceDto.adminReason;
    }

    const updatedAbsence = await this.absenceModel
      .findByIdAndUpdate(absenceId, updateData, { new: true })
      .populate('agentId', 'nom prenoms email')
      .exec();

    // Notifier l'agent du changement de statut
    await this.notifyAgentAboutStatusUpdate(updatedAbsence!);

    return updatedAbsence!;
  }

  async getAgentAbsences(agentId: string): Promise<AbsenceDocument[]> {
  return this.absenceModel
    .find({ agentId: new Types.ObjectId(agentId) })
    .populate('validatedBy', 'nom prenoms')
    .sort({ createdAt: -1 }) // Du plus récent au plus ancien
    .exec();
}

async getAllAbsences(): Promise<AbsenceDocument[]> {
  return this.absenceModel
    .find()
    .populate('agentId', 'nom prenoms email profile')
    .populate('validatedBy', 'nom prenoms')
    .sort({ createdAt: -1 }) // Du plus récent au plus ancien
    .exec();
}

async getPendingAbsences(): Promise<AbsenceDocument[]> {
  return this.absenceModel
    .find({ status: AbsenceStatus.PENDING })
    .populate('agentId', 'nom prenoms email')
    .sort({ createdAt: -1 }) // Changer de 1 à -1 pour du plus récent au plus ancien
    .exec();
}

  async getAbsenceById(absenceId: string): Promise<AbsenceDocument> {
    const absence = await this.absenceModel
      .findById(absenceId)
      .populate('agentId', 'nom prenoms email')
      .populate('validatedBy', 'nom prenoms')
      .exec();

    if (!absence) {
      throw new NotFoundException("Demande d'absence non trouvée");
    }

    return absence;
  }

  async deleteAbsence(absenceId: string, agentId: string): Promise<void> {
    const absence = await this.getAbsenceById(absenceId);

    // Seul l'agent propriétaire peut supprimer sa demande en attente
    const absenceAgentId = this.extractUserId(absence.agentId);
    if (absenceAgentId !== agentId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas supprimer cette demande',
      );
    }

    if (absence.status !== AbsenceStatus.PENDING) {
      throw new BadRequestException(
        'Seules les demandes en attente peuvent être supprimées',
      );
    }

    await this.absenceModel.findByIdAndDelete(absenceId).exec();
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

  // Méthode utilitaire pour extraire le nom complet d'un user
  private extractUserName(user: any): string {
    if (user && user.nom && user.prenoms) {
      return `${user.nom} ${user.prenoms}`;
    }
    return 'Utilisateur inconnu';
  }

  private async notifyAdminsAboutNewAbsence(absence: AbsenceDocument): Promise<void> {
    try {
      // Récupérer tous les admins
      const admins = await this.usersService.findAdmins();

      // Récupérer les informations complètes de l'agent
      const agentId = this.extractUserId(absence.agentId);
      const agent = await this.usersService.findById(agentId);
      const agentName = agent ? `${agent.prenoms} ${agent.nom}` : 'Un agent';

      // Notification dans l'application
      for (const admin of admins) {
        const adminId = this.extractUserId(admin._id);
        const absenceId = this.extractUserId(absence._id);

        await this.notificationsService.createNotification(
          adminId,
          NotificationType.ABSENCE_CREATED,
          "Nouvelle demande d'absence",
          `${agentName} a soumis une demande d'absence du ${this.formatDate(absence.startDate)} au ${this.formatDate(absence.endDate)}`,
          absenceId,
        );
      }

      // ENVOI D'EMAIL aux admins
      await this.mailService.notifyAdminsNewAbsence(admins, absence, agentName);

    } catch (error) {
      console.error('Erreur lors de la notification des admins:', error);
    }
  }

  private async notifyAgentAboutStatusUpdate(absence: AbsenceDocument): Promise<void> {
    try {
      let title = '';
      let message = '';

      const agentId = this.extractUserId(absence.agentId);
      const absenceId = this.extractUserId(absence._id);
      const agent = await this.usersService.findById(agentId);

      if (absence.status === AbsenceStatus.APPROVED) {
        title = "Demande d'absence approuvée";
        message = `Votre demande d'absence du ${this.formatDate(absence.startDate)} au ${this.formatDate(absence.endDate)} a été approuvée.`;

        if (absence.adminReason) {
          message += `\n\nMessage de l'admin: ${absence.adminReason}`;
        }
      } else if (absence.status === AbsenceStatus.REJECTED) {
        title = "Demande d'absence rejetée";
        message = `Votre demande d'absence du ${this.formatDate(absence.startDate)} au ${this.formatDate(absence.endDate)} a été rejetée.`;

        if (absence.adminReason) {
          message += `\n\nRaison du rejet: ${absence.adminReason}`;
        }
      }

      if (title && message) {
        // Notification dans l'application
        await this.notificationsService.createNotification(
          agentId,
          absence.status === AbsenceStatus.APPROVED
            ? NotificationType.ABSENCE_APPROVED
            : NotificationType.ABSENCE_REJECTED,
          title,
          message,
          absenceId,
        );

        // ENVOI D'EMAIL à l'agent
        if (agent) {
          await this.mailService.notifyAgentAbsenceStatus(
            agent, 
            absence, 
            absence.status, 
            absence.adminReason
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la notification de l'agent:", error);
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }

  // Statistiques pour le dashboard
  async getAbsenceStats(agentId?: string): Promise<any> {
    const matchStage: any = {};
    if (agentId) {
      matchStage.agentId = new Types.ObjectId(agentId);
    }

    const stats = await this.absenceModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$duration' },
        },
      },
    ]);

    return stats;
  }
}
