// backend/src/invoices/invoices.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Request } from 'express';
import { Types } from 'mongoose';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    profile: string;
  };
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // Agent: Créer une facture
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadInvoice(
    @UploadedFile() file: Express.Multer.File,
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    return this.invoicesService.createInvoice(
      req.user.userId,
      createInvoiceDto,
      file,
    );
  }

  // Agent: Voir ses factures
  @Get('my-invoices')
  async getMyInvoices(@Req() req: AuthenticatedRequest) {
    return this.invoicesService.getAgentInvoices(req.user.userId);
  }

  // Admin: Voir toutes les factures
  @Get('all')
  @UseGuards(AdminGuard)
  async getAllInvoices() {
    return this.invoicesService.getAllInvoices();
  }

  // Admin: Voir les factures d'un agent spécifique
  @Get('agent/:agentId')
  @UseGuards(AdminGuard)
  async getAgentInvoices(@Param('agentId') agentId: string) {
    return this.invoicesService.getAgentInvoices(agentId);
  }

  // Admin: Mettre à jour une facture
  @Put(':id')
  @UseGuards(AdminGuard)
  async updateInvoice(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invoicesService.updateInvoice(
      id,
      req.user.userId,
      updateInvoiceDto,
    );
  }

  // Télécharger une facture
  @Get('download/:id')
  async downloadInvoice(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.getInvoiceById(id);
    
    // Vérifier les permissions
    const isAdmin = req.user.profile === 'admin';
    const agentId = this.extractUserId(invoice.agentId);
    const isOwner = agentId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Accès non autorisé');
    }

    return res.redirect(invoice.pdfUrl);
  }

  @Get(':id')
  async getInvoice(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const invoice = await this.invoicesService.getInvoiceById(id);
    
    // Vérifier les permissions
    const isAdmin = req.user.profile === 'admin';
    const agentId = this.extractUserId(invoice.agentId);
    const isOwner = agentId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Accès non autorisé');
    }

    return invoice;
  }

  @Delete(':id')
  async deleteInvoice(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const invoice = await this.invoicesService.getInvoiceById(id);
    
    // Vérifier les permissions: admin OU propriétaire de la facture
    const isAdmin = req.user.profile === 'admin';
    const agentId = this.extractUserId(invoice.agentId);
    const isOwner = agentId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès réservé aux administrateurs ou au propriétaire de la facture');
    }

    await this.invoicesService.deleteInvoice(id);
    return { message: 'Facture supprimée avec succès' };
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
    return '';
  }
}