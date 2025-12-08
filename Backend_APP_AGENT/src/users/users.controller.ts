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
import { UserProfile } from './schemas/user.schema';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    profile: string;
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

  // @Get()
  // @UseGuards(AdminGuard)
  // findAll() {
  //   return this.usersService.findAll();
  // }

  @Get('stats')
  @UseGuards(AdminGuard)
  getStats() {
    return this.usersService.getUserStats();
  }

  @Get('non-admins')
  @UseGuards(AdminGuard)
  findNonAdmins() {
    return this.usersService.findNonAdmins();
  }

  @Get('admins')
  @UseGuards(AdminGuard)
  findAdmins() {
    return this.usersService.findAdmins();
  }

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

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findOne(id);

    const userId = user._id ? user._id.toString() : (user as any).id;

    const isAdmin = req.user.profile === 'admin';
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
    return this.usersService.update(id, updateUserDto, req.user.profile);
  }

  /**
   * NOUVELLE ROUTE : Changer le profil d'un utilisateur
   * Cette route ge¨re tous les changements de profil
   */
  @Patch(':id/change-profile')
  @UseGuards(AdminGuard)
  async changeProfile(
    @Param('id') id: string,
    @Body('profile') profile: UserProfile,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.changeUserProfile(id, profile, req.user.userId);
  }

  /**
   * Route pour promouvoir en admin (conservée pour compatibilité)
   */
  @Patch(':id/promote-to-admin')
  @UseGuards(AdminGuard)
  promoteToAdmin(@Param('id') id: string) {
    return this.usersService.promoteToAdmin(id);
  }

  /**
   * Route pour changer le profil d'un admin (obsole¨te, utilisez change-profile)
   * @deprecated Utilisez plute´t la route /change-profile
   */
  @Patch(':id/change-admin-profile')
  @UseGuards(AdminGuard)
  changeAdminProfile(
    @Param('id') id: string,
    @Body('profile') profile: string,
  ) {
    return this.usersService.changeAdminProfile(id, profile as any);
  }

  // @Delete(':id')
  // @HttpCode(204)
  // @UseGuards(AdminGuard)
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(id);
  // }

  // Dans la classe UsersController

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
   * Supprimer définitivement un utilisateur (optionnel - garder pour admin)
   */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
