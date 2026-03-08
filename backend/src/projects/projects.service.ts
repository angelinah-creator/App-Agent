// backend/src/projects/projects.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    creatorId: string,
  ): Promise<ProjectDocument> {
    const project = new this.projectModel({
      ...createProjectDto,
      createdBy: new Types.ObjectId(creatorId),
      invitedManagers: (createProjectDto.invitedManagers || []).map(
        (id) => new Types.ObjectId(id),
      ),
      invitedCollaborateurs: (createProjectDto.invitedCollaborateurs || []).map(
        (id) => new Types.ObjectId(id),
      ),
    });
    const saved = await project.save();
    return this.findOne((saved._id as Types.ObjectId).toString(), creatorId, 'admin');
  }

  async findAllForAdmin(): Promise<ProjectDocument[]> {
    return this.projectModel
      .find()
      .populate('createdBy', 'nom prenoms email profilePhoto role')
      .populate('invitedManagers', 'nom prenoms email profilePhoto role')
      .populate('invitedCollaborateurs', 'nom prenoms email profilePhoto role')
      .populate('files.uploadedBy', 'nom prenoms email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllForManager(managerId: string): Promise<ProjectDocument[]> {
    const objectId = new Types.ObjectId(managerId);
    return this.projectModel
      .find({
        $or: [
          { createdBy: objectId },
          { invitedManagers: objectId },
        ],
      })
      .populate('createdBy', 'nom prenoms email profilePhoto role')
      .populate('invitedManagers', 'nom prenoms email profilePhoto role')
      .populate('invitedCollaborateurs', 'nom prenoms email profilePhoto role')
      .populate('files.uploadedBy', 'nom prenoms email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllForCollaborateur(
    collaborateurId: string,
  ): Promise<ProjectDocument[]> {
    const objectId = new Types.ObjectId(collaborateurId);
    return this.projectModel
      .find({ invitedCollaborateurs: objectId })
      .populate('createdBy', 'nom prenoms email profilePhoto role')
      .populate('invitedManagers', 'nom prenoms email profilePhoto role')
      .populate('invitedCollaborateurs', 'nom prenoms email profilePhoto role')
      .populate('files.uploadedBy', 'nom prenoms email')
      .sort({ createdAt: -1 })
      .exec();
  }

  // NOUVELLE MÉTHODE POUR RAPPORT COLLABORATEUR
  async findAllForUser(targetUserId: string, targetUserRole: string): Promise<ProjectDocument[]> {
    const objectId = new Types.ObjectId(targetUserId);

    if (targetUserRole === 'admin') {
      return this.findAllForAdmin();
    } else if (targetUserRole === 'manager') {
      return this.findAllForManager(targetUserId);
    } else if (targetUserRole === 'collaborateur') {
      return this.findAllForCollaborateur(targetUserId);
    }

    return [];
  }

  async findOne(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<ProjectDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID projet invalide');
    }

    const project = await this.projectModel
      .findById(id)
      .populate('createdBy', 'nom prenoms email profilePhoto role')
      .populate('invitedManagers', 'nom prenoms email profilePhoto role')
      .populate('invitedCollaborateurs', 'nom prenoms email profilePhoto role')
      .populate('files.uploadedBy', 'nom prenoms email')
      .exec();

    if (!project) {
      throw new NotFoundException(`Projet ${id} introuvable`);
    }

    this.checkAccess(project, userId, userRole);
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    userRole: string,
  ): Promise<ProjectDocument> {
    const project = await this.findOne(id, userId, userRole);
    this.checkWriteAccess(project, userId, userRole);

    const updateData: any = { ...updateProjectDto };

    if (updateProjectDto.invitedManagers) {
      updateData.invitedManagers = updateProjectDto.invitedManagers.map(
        (mid) => new Types.ObjectId(mid),
      );
    }
    if (updateProjectDto.invitedCollaborateurs) {
      updateData.invitedCollaborateurs =
        updateProjectDto.invitedCollaborateurs.map(
          (cid) => new Types.ObjectId(cid),
        );
    }

    await this.projectModel.findByIdAndUpdate(id, updateData).exec();
    return this.findOne(id, userId, userRole);
  }

  async inviteManager(
    projectId: string,
    managerId: string,
    userId: string,
    userRole: string,
  ): Promise<ProjectDocument> {
    const project = await this.findOne(projectId, userId, userRole);

    const creatorId = this.getCreatorId(project);
    if (userRole !== 'admin' && creatorId !== userId) {
      throw new ForbiddenException(
        'Seul le créateur ou un administrateur peut inviter des managers',
      );
    }

    const managerObjectId = new Types.ObjectId(managerId);

    const alreadyInvited = project.invitedManagers.some(
      (m: any) =>
        (m._id ? m._id.toString() : m.toString()) === managerId,
    );
    if (alreadyInvited) {
      throw new BadRequestException('Ce manager est déjà invité');
    }

    await this.projectModel
      .findByIdAndUpdate(projectId, {
        $push: { invitedManagers: managerObjectId },
      })
      .exec();

    return this.findOne(projectId, userId, userRole);
  }

  async removeManager(
    projectId: string,
    managerId: string,
    userId: string,
    userRole: string,
  ): Promise<ProjectDocument> {
    const project = await this.findOne(projectId, userId, userRole);

    const creatorId = this.getCreatorId(project);
    if (userRole !== 'admin' && creatorId !== userId) {
      throw new ForbiddenException(
        'Seul le créateur ou un administrateur peut retirer des managers',
      );
    }

    await this.projectModel
      .findByIdAndUpdate(projectId, {
        $pull: { invitedManagers: new Types.ObjectId(managerId) },
      })
      .exec();

    return this.findOne(projectId, userId, userRole);
  }

  async inviteCollaborateur(
    projectId: string,
    collaborateurId: string,
    userId: string,
    userRole: string,
  ): Promise<ProjectDocument> {
    const project = await this.findOne(projectId, userId, userRole);

    const canInvite = this.canManageMembers(project, userId, userRole);
    if (!canInvite) {
      throw new ForbiddenException(
        'Vous n\'avez pas le droit d\'inviter des collaborateurs',
      );
    }

    const collabObjectId = new Types.ObjectId(collaborateurId);

    const alreadyInvited = project.invitedCollaborateurs.some(
      (c: any) =>
        (c._id ? c._id.toString() : c.toString()) === collaborateurId,
    );
    if (alreadyInvited) {
      throw new BadRequestException('Ce collaborateur est déjà invité');
    }

    await this.projectModel
      .findByIdAndUpdate(projectId, {
        $push: { invitedCollaborateurs: collabObjectId },
      })
      .exec();

    return this.findOne(projectId, userId, userRole);
  }

  async removeCollaborateur(
    projectId: string,
    collaborateurId: string,
    userId: string,
    userRole: string,
  ): Promise<ProjectDocument> {
    const project = await this.findOne(projectId, userId, userRole);

    const canInvite = this.canManageMembers(project, userId, userRole);
    if (!canInvite) {
      throw new ForbiddenException(
        'Vous n\'avez pas le droit de retirer des collaborateurs',
      );
    }

    await this.projectModel
      .findByIdAndUpdate(projectId, {
        $pull: { invitedCollaborateurs: new Types.ObjectId(collaborateurId) },
      })
      .exec();

    return this.findOne(projectId, userId, userRole);
  }

  async getAvailableMembers(): Promise<{
    managers: any[];
    collaborateurs: any[];
  }> {
    const managers = await this.userModel
      .find({ role: 'manager', archived: false })
      .select('_id nom prenoms email role profile profilePhoto')
      .exec();

    const collaborateurs = await this.userModel
      .find({ role: 'collaborateur', archived: false })
      .select('_id nom prenoms email role profile profilePhoto')
      .exec();

    return { managers, collaborateurs };
  }

  private getCreatorId(project: ProjectDocument): string {
    const cb = project.createdBy as any;
    return (cb?._id ?? cb).toString();
  }

  private checkAccess(
    project: ProjectDocument,
    userId: string,
    userRole: string,
  ): void {
    if (userRole === 'admin') return;

    const creatorId = this.getCreatorId(project);

    if (userRole === 'manager') {
      const isCreator = creatorId === userId;
      const isInvitedManager = project.invitedManagers.some(
        (m: any) =>
          (m._id ? m._id.toString() : m.toString()) === userId,
      );
      if (!isCreator && !isInvitedManager) {
        throw new ForbiddenException('Accès non autorisé à ce projet');
      }
      return;
    }

    if (userRole === 'collaborateur') {
      const isInvited = project.invitedCollaborateurs.some(
        (c: any) =>
          (c._id ? c._id.toString() : c.toString()) === userId,
      );
      if (!isInvited) {
        throw new ForbiddenException('Accès non autorisé à ce projet');
      }
      return;
    }

    throw new ForbiddenException('Accès non autorisé');
  }

  private checkWriteAccess(
    project: ProjectDocument,
    userId: string,
    userRole: string,
  ): void {
    if (userRole === 'admin') return;

    const creatorId = this.getCreatorId(project);

    if (userRole === 'manager') {
      const isCreator = creatorId === userId;
      const isInvitedManager = project.invitedManagers.some(
        (m: any) =>
          (m._id ? m._id.toString() : m.toString()) === userId,
      );
      if (!isCreator && !isInvitedManager) {
        throw new ForbiddenException('Droits insuffisants sur ce projet');
      }
      return;
    }

    if (userRole === 'collaborateur') {
      const isInvited = project.invitedCollaborateurs.some(
        (c: any) =>
          (c._id ? c._id.toString() : c.toString()) === userId,
      );
      if (!isInvited) {
        throw new ForbiddenException('Droits insuffisants sur ce projet');
      }
      return;
    }

    throw new ForbiddenException('Accès non autorisé');
  }

  private canManageMembers(
    project: ProjectDocument,
    userId: string,
    userRole: string,
  ): boolean {
    if (userRole === 'admin') return true;
    const creatorId = this.getCreatorId(project);
    if (userRole === 'manager') {
      const isCreator = creatorId === userId;
      const isInvitedManager = project.invitedManagers.some(
        (m: any) =>
          (m._id ? m._id.toString() : m.toString()) === userId,
      );
      return isCreator || isInvitedManager;
    }
    return false;
  }
}