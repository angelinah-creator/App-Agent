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
  ForbiddenException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Request } from 'express';
import { UserRole, UserProfile } from './schemas/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';

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

  /**
   * Uploader une photo de profil
   */
  @Post(':id/profile-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadProfilePhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    // Vérifier que l'utilisateur peut modifier ce profil
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = id === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Le fichier doit être une image');
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException("L'image ne doit pas dépasser 5MB");
    }

    return this.usersService.uploadProfilePhoto(id, file);
  }

  /**
   * Supprimer la photo de profil
   */
  @Delete(':id/profile-photo')
  async deleteProfilePhoto(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Vérifier que l'utilisateur peut modifier ce profil
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = id === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.usersService.deleteProfilePhoto(id);
  }

  /**
   * Uploader une signature
   */
  @Post(':id/signature')
  @UseInterceptors(FileInterceptor('signature'))
  async uploadSignature(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = id === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Le fichier doit être une image');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException("L'image ne doit pas dépasser 2MB");
    }

    return this.usersService.uploadSignature(id, file);
  }

  /**
   * Mettre à jour les informations personnelles
   */
  @Patch(':id/personal-info')
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async updatePersonalInfo(
    @Param('id') id: string,
    @Body() updateData: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    // Vérifier que l'utilisateur peut modifier ce profil
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = id === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // Si un fichier est uploadé, l'ajouter aux données
    const dataWithFile = {
      ...updateData,
      profilePhoto: file,
    };

    return this.usersService.updatePersonalInfo(id, dataWithFile);
  }

  /**
   * Changer le mot de passe
   */
  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { currentPassword: string; newPassword: string },
    @Req() req: AuthenticatedRequest,
  ) {
    // Vérifier que l'utilisateur peut modifier ce profil
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = id === req.user.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return this.usersService.changePassword(
      id,
      body.currentPassword,
      body.newPassword,
    );
  }
}
