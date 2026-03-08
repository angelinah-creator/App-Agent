// backend/src/spaces/spaces.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Space, SpaceDocument } from './schemas/space.schema';
import { SpacePermission, SpacePermissionDocument, PermissionLevel } from '../space-permissions/schemas/space-permission.schema';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class SpacesService {
  constructor(
    @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>,
    @InjectModel(SpacePermission.name) private spacePermissionModel: Model<SpacePermissionDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createSpace(createSpaceDto: CreateSpaceDto, userId: string): Promise<SpaceDocument> {
    const space = new this.spaceModel({
      ...createSpaceDto,
      createdBy: new Types.ObjectId(userId),
    });
    const savedSpace = await space.save();

    // Créer une permission SUPER_EDITOR pour le créateur
    await this.spacePermissionModel.create({
      spaceId: savedSpace._id,
      userId: new Types.ObjectId(userId),
      permissionLevel: PermissionLevel.SUPER_EDITOR,
    });

    return savedSpace;
  }

  async getUserSpaces(userId: string): Promise<SpaceDocument[]> {
    const userPermissions = await this.spacePermissionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('spaceId')
      .exec();
    
    const spaceIds = userPermissions
      .filter(permission => permission.spaceId)
      .map(permission => (permission.spaceId as any)._id);
    
    if (spaceIds.length === 0) {
      return [];
    }
    
    return this.spaceModel.find({
      _id: { $in: spaceIds },
      isActive: true
    })
    .populate('createdBy', 'nom prenoms email')
    .exec();
  }

  async getAllSpaces(filters?: any): Promise<SpaceDocument[]> {
    const query: any = {};

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return this.spaceModel.find(query)
      .populate('createdBy', 'nom prenoms email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSpaceById(spaceId: string): Promise<SpaceDocument> {
    const space = await this.spaceModel.findById(spaceId).populate('createdBy', 'nom prenoms email').exec();
    if (!space) {
      throw new NotFoundException('Espace non trouvé');
    }
    return space;
  }

  async updateSpace(spaceId: string, updateSpaceDto: UpdateSpaceDto, userId: string): Promise<SpaceDocument> {
    const space = await this.getSpaceById(spaceId);
    
    if (updateSpaceDto.photo && space.photo?.publicId) {
      try {
        await this.cloudinaryService.deleteImage(space.photo.publicId);
        console.log('Ancienne photo supprimée:', space.photo.publicId);
      } catch (error) {
        console.error('Erreur suppression ancienne photo:', error);
      }
    }

    const updated = await this.spaceModel.findByIdAndUpdate(spaceId, updateSpaceDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('Espace non trouvé');
    }
    return updated;
  }

  async deleteSpace(spaceId: string, userId: string): Promise<void> {
    const space = await this.getSpaceById(spaceId);

    if (space.photo?.publicId) {
      try {
        await this.cloudinaryService.deleteImage(space.photo.publicId);
        console.log('Photo supprimée lors de la suppression de l\'espace');
      } catch (error) {
        console.error('Erreur suppression photo:', error);
      }
    }

    const result = await this.spaceModel.findByIdAndDelete(spaceId).exec();
    if (!result) {
      throw new NotFoundException('Espace non trouvé');
    }
  }

  async getMyCreatedSpaces(userId: string): Promise<SpaceDocument[]> {
    return this.spaceModel.find({
      createdBy: new Types.ObjectId(userId),
      isActive: true
    })
    .populate('createdBy', 'nom prenoms email')
    .exec();
  }

  async uploadSpacePhoto(file: Express.Multer.File, spaceName: string): Promise<{ url: string; publicId: string }> {
    const fileName = `space_${spaceName.replace(/\s+/g, '_')}_${Date.now()}`;
    return this.cloudinaryService.uploadImage(file.buffer, fileName, 'agent_code_talent/spaces');
  }
}