import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(to: string, subject: string, template: string, context: any) {
    try {
      console.log(`📧 Envoi email vers ${to} avec template ${template}`);
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      console.log(`✅ Email envoyé avec succès à ${to}`);
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      // Ne pas bloquer l'application si l'email échoue
    }
  }

  async notifyAdminsNewAbsence(
    admins: any[],
    absenceData: any,
    agentName: string,
  ) {
    const subject = `Nouvelle demande d'absence - ${agentName}`;

    for (const admin of admins) {
      await this.sendMail(admin.email, subject, 'absence-created', {
        adminName: admin.prenoms,
        agentName,
        startDate: new Date(absenceData.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(absenceData.endDate).toLocaleDateString('fr-FR'),
        reason: absenceData.reason,
        backupPerson: absenceData.backupPerson,
      });
    }
  }

  async notifyAgentAbsenceStatus(
    agent: any,
    absenceData: any,
    status: string,
    adminReason?: string,
  ) {
    const statusText = status === 'approved' ? 'approuvée' : 'rejetée';
    const subject = `Votre demande d'absence a été ${statusText}`;

    await this.sendMail(agent.email, subject, 'absence-status', {
      agentName: agent.prenoms,
      status, // approved ou rejected pour le CSS
      statusText, // texte en français
      startDate: new Date(absenceData.startDate).toLocaleDateString('fr-FR'),
      endDate: new Date(absenceData.endDate).toLocaleDateString('fr-FR'),
      reason: absenceData.reason,
      adminReason,
    });
  }

  async notifyAdminsNewInvoice(
    admins: any[],
    invoiceData: any,
    agentName: string,
  ) {
    const subject = `Nouvelle facture reçue - ${agentName}`;

    for (const admin of admins) {
      await this.sendMail(admin.email, subject, 'invoice-created', {
        adminName: admin.prenoms,
        agentName,
        reference: invoiceData.reference,
        month: invoiceData.month,
        year: invoiceData.year,
      });
    }
  }

  async notifyAgentInvoiceStatus(agent: any, invoiceData: any, status: string) {
    const statusText = status === 'paid' ? 'payée' : 'mise à jour';
    const subject =
      status === 'paid'
        ? 'Votre facture a été payée'
        : 'Statut de votre facture mis à jour';

    await this.sendMail(agent.email, subject, 'invoice-status', {
      agentName: agent.prenoms,
      status, // paid ou unpaid pour le CSS
      statusText, // texte en français
      reference: invoiceData.reference,
      month: invoiceData.month,
      year: invoiceData.year,
      amount: invoiceData.amount,
      paymentDate: invoiceData.paymentDate
        ? new Date(invoiceData.paymentDate).toLocaleDateString('fr-FR')
        : null,
      transferReference: invoiceData.transferReference,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.sendMail(
      to,
      'Réinitialisation de votre mot de passe - Agent Code Talent',
      'password-reset',
      {
        userName,
        resetLink,
        expiryHours: 1,
      },
    );
  }
}
