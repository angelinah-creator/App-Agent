// backend/src/contracts/contracts.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseGuards,
  Put,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserRole } from '../users/schemas/user.schema';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    profile?: string;
  };
}

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}
  
  @Post('generate-after-signup/:userId')
  async generateAfterSignup(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = userId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.contractsService.generateContract(userId);
  }

  @Post('generate/:userId')
  @UseGuards(AdminGuard)
  async generateContract(@Param('userId') userId: string) {
    return this.contractsService.generateContract(userId);
  }

  @Get('user/:userId')
  async getUserContracts(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = userId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.contractsService.getUserContracts(userId);
  }

  @Get(':contractId')
  async getContract(
    @Param('contractId') contractId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const contract = await this.contractsService.getContractById(contractId);
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = contract.userId.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return contract;
  }

  @Put('regenerate/:contractId')
  async regenerateContract(@Param('contractId') contractId: string) {
    return this.contractsService.regenerateContract(contractId);
  }

  @Delete(':contractId')
  @UseGuards(AdminGuard)
  async deleteContract(@Param('contractId') contractId: string) {
    await this.contractsService.deleteContract(contractId);
    return { message: 'Contrat supprimé avec succès' };
  }
}