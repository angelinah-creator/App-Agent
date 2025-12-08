import { Controller, Post, Get, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('generate/:userId')
  async generateContract(@Param('userId') userId: string) {
    return this.contractsService.generateContract(userId);
  }

  @Get('user/:userId')
  async getUserContracts(@Param('userId') userId: string) {
    return this.contractsService.getUserContracts(userId);
  }

  @Get(':contractId')
  async getContract(@Param('contractId') contractId: string) {
    return this.contractsService.getContractById(contractId);
  }

  @Put('regenerate/:contractId')
  async regenerateContract(@Param('contractId') contractId: string) {
    return this.contractsService.regenerateContract(contractId);
  }

  @Delete(':contractId')
  async deleteContract(@Param('contractId') contractId: string) {
    await this.contractsService.deleteContract(contractId);
    return { message: 'Contrat supprimé avec succès' };
  }
}