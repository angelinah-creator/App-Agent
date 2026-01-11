// backend/src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Request } from 'express';
import { UserRole, UserProfile } from './schemas/user.schema';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    profile?: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  getStats() {
    return this.usersService.getUserStats();
  }

  // Routes pour récupérer par rôle
  @Get('role/:role')
  @UseGuards(AdminGuard)
  findByRole(@Param('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }

  @Get('admins')
  @UseGuards(AdminGuard)
  findAdmins() {
    return this.usersService.findAdmins();
  }

  @Get('collaborateurs')
  @UseGuards(AdminGuard)
  findCollaborateurs() {
    return this.usersService.findCollaborateurs();
  }

  @Get('managers')
  @UseGuards(AdminGuard)
  findManagers() {
    return this.usersService.findManagers();
  }

  @Get('clients')
  @UseGuards(AdminGuard)
  findClients() {
    return this.usersService.findClients();
  }

  // Routes pour récupérer par profil (uniquement collaborateurs et managers)
  @Get('stagiaires')
  @UseGuards(AdminGuard)
  findStagiaires() {
    return this.usersService.findStagiaires();
  }

  @Get('prestataires')
  @UseGuards(AdminGuard)
  findPrestataires() {
    return this.usersService.findPrestataires();
  }

  @Get('non-admins')
  @UseGuards(AdminGuard)
  findNonAdmins() {
    return this.usersService.findNonAdmins();
  }

  // Recherche d'utilisateurs avec filtres
  @Get('search')
  // @UseGuards(AdminGuard)
  searchUsers(
    @Query('role') role?: UserRole,
    @Query('profile') profile?: UserProfile,
    @Query('searchTerm') searchTerm?: string,
    @Query('archived') archived?: string,
  ) {
    const filters: any = {};
    
    if (role) filters.role = role;
    if (profile) filters.profile = profile;
    if (searchTerm) filters.searchTerm = searchTerm;
    if (archived !== undefined) filters.archived = archived === 'true';

    return this.usersService.searchUsers(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findOne(id);

    const userId = user._id ? user._id.toString() : (user as any).id;

    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = userId === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Accès non autorisé');
    }

    return user;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(id, updateUserDto, req.user.role);
  }

  /**
   * NOUVELLE ROUTE : Changer le rôle d'un utilisateur
   */
  @Patch(':id/change-role')
  @UseGuards(AdminGuard)
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.changeUserRole(id, role, req.user.userId);
  }

  /**
   * NOUVELLE ROUTE : Changer le profil d'un collaborateur/manager
   */
  @Patch(':id/change-profile')
  @UseGuards(AdminGuard)
  async changeProfile(
    @Param('id') id: string,
    @Body('profile') profile: UserProfile,
  ) {
    return this.usersService.changeUserProfile(id, profile);
  }

  /**
   * Route pour promouvoir en admin
   */
  @Patch(':id/promote-to-admin')
  @UseGuards(AdminGuard)
  promoteToAdmin(@Param('id') id: string) {
    return this.usersService.promoteToAdmin(id);
  }

  /**
   * Route pour mettre à jour le profil client
   */
  @Patch('clients/:id/complete-profile')
  @UseGuards(AdminGuard)
  async completeClientProfile(
    @Param('id') id: string,
    @Body() profileData: any,
  ) {
    return this.usersService.updateClientProfile(id, profileData);
  }

  /**
   * Récupérer tous les utilisateurs avec option d'inclure les archivés
   */
  @Get()
  @UseGuards(AdminGuard)
  findAll(@Query('includeArchived') includeArchived: string) {
    const include = includeArchived === 'true';
    return this.usersService.findAll(include);
  }

  /**
   * Récupérer uniquement les utilisateurs archivés
   */
  @Get('archived')
  @UseGuards(AdminGuard)
  findArchived() {
    return this.usersService.findArchived();
  }

  /**
   * Archiver un utilisateur
   */
  @Patch(':id/archive')
  @UseGuards(AdminGuard)
  archiveUser(
    @Param('id') id: string,
    @Body('archiveReason') archiveReason?: string,
  ) {
    return this.usersService.archiveUser(id, archiveReason);
  }

  /**
   * Restaurer un utilisateur archivé
   */
  @Patch(':id/restore')
  @UseGuards(AdminGuard)
  restoreUser(@Param('id') id: string) {
    return this.usersService.restoreUser(id);
  }

  /**
   * Supprimer définitivement un utilisateur
   */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}