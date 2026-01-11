import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SpacePermission, SpacePermissionDocument, PermissionLevel } from './schemas/space-permission.schema';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { SpacesService } from '../spaces/spaces.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SpacePermissionsService {
  constructor(
    @InjectModel(SpacePermission.name) private spacePermissionModel: Model<SpacePermissionDocument>,
    private spacesService: SpacesService,
    private usersService: UsersService,
  ) {}

  async inviteUserToSpace(spaceId: string, inviteUserDto: InviteUserDto, requestedBy: string, userRole?: string): Promise<SpacePermissionDocument> {
    // Vérifier que l'espace existe
    await this.spacesService.getSpaceById(spaceId);
    
    // Vérifier que l'utilisateur existe
    const user = await this.usersService.findById(inviteUserDto.userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'invitation existe déjà
    const existingPermission = await this.spacePermissionModel.findOne({
      spaceId: new Types.ObjectId(spaceId),
      userId: new Types.ObjectId(inviteUserDto.userId),
    });

    if (existingPermission) {
      throw new ConflictException('Cet utilisateur a déjà accès à cet espace');
    }

    const permission = new this.spacePermissionModel({
      spaceId: new Types.ObjectId(spaceId),
      userId: new Types.ObjectId(inviteUserDto.userId),
      permissionLevel: inviteUserDto.permissionLevel,
    });

    return permission.save();
  }

  async getUserPermission(spaceId: string, userId: string): Promise<SpacePermissionDocument | null> {
    return this.spacePermissionModel.findOne({
      spaceId: new Types.ObjectId(spaceId),
      userId: new Types.ObjectId(userId),
    }).populate('userId', 'nom prenoms email').exec();
  }

  async canUserEdit(spaceId: string, userId: string, userRole?: string): Promise<boolean> {
    // Les admins et managers peuvent toujours éditer
    if (userRole === 'admin' || userRole === 'manager') {
      return true;
    }

    // Pour les autres utilisateurs, vérifier les permissions
    const permission = await this.getUserPermission(spaceId, userId);
    
    if (!permission) {
      return false;
    }
    
    return [PermissionLevel.EDITOR, PermissionLevel.SUPER_EDITOR].includes(permission.permissionLevel);
  }

  async canUserManagePermissions(spaceId: string, userId: string, userRole?: string): Promise<boolean> {
    // Les admins et managers peuvent toujours gérer les permissions
    if (userRole === 'admin' || userRole === 'manager') {
      return true;
    }

    // Pour les autres utilisateurs, vérifier les permissions SUPER_EDITOR
    const permission = await this.getUserPermission(spaceId, userId);
    
    if (!permission) {
      return false;
    }
    
    return permission.permissionLevel === PermissionLevel.SUPER_EDITOR;
  }

  async getSpacePermissions(spaceId: string): Promise<SpacePermissionDocument[]> {
    return this.spacePermissionModel
      .find({ spaceId: new Types.ObjectId(spaceId) })
      .populate('userId', 'nom prenoms email role')
      .exec();
  }

  async updateUserPermission(spaceId: string, targetUserId: string, updatePermissionDto: UpdatePermissionDto, requestedBy: string, userRole?: string): Promise<SpacePermissionDocument> {
    // Les admins et managers peuvent toujours gérer les permissions
    if (userRole !== 'admin' && userRole !== 'manager') {
      // Pour les autres utilisateurs, vérifier les permissions SUPER_EDITOR
      const canManage = await this.canUserManagePermissions(spaceId, requestedBy);
      if (!canManage) {
        throw new ForbiddenException('Vous n\'avez pas les droits pour gérer les permissions');
      }
    }

    const updated = await this.spacePermissionModel.findOneAndUpdate(
      {
        spaceId: new Types.ObjectId(spaceId),
        userId: new Types.ObjectId(targetUserId),
      },
      { permissionLevel: updatePermissionDto.permissionLevel },
      { new: true }
    ).populate('userId', 'nom prenoms email').exec();

    if (!updated) {
      throw new NotFoundException('Permission non trouvée');
    }

    return updated;
  }

  async removeUserFromSpace(spaceId: string, targetUserId: string, requestedBy: string, userRole?: string): Promise<void> {
    // Les admins et managers peuvent toujours retirer des utilisateurs
    if (userRole !== 'admin' && userRole !== 'manager') {
      // Pour les autres utilisateurs, vérifier les permissions SUPER_EDITOR
      const canManage = await this.canUserManagePermissions(spaceId, requestedBy);
      if (!canManage) {
        throw new ForbiddenException('Vous n\'avez pas les droits pour retirer des utilisateurs');
      }
    }

    const result = await this.spacePermissionModel.findOneAndDelete({
      spaceId: new Types.ObjectId(spaceId),
      userId: new Types.ObjectId(targetUserId),
    }).exec();

    if (!result) {
      throw new NotFoundException('Permission non trouvée');
    }
  }

  async getUserSpacesWithPermissions(userId: string): Promise<SpacePermissionDocument[]> {
    return this.spacePermissionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('spaceId')
      .exec();
  }
}