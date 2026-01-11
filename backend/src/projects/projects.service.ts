import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = new this.projectModel({
      ...createProjectDto,
      id_client: new Types.ObjectId(createProjectDto.id_client),
      agent_affectes: createProjectDto.agent_affectes.map(
        (id) => new Types.ObjectId(id),
      ),
    });
    return project.save();
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel
      .find()
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const updateData: any = { ...updateProjectDto };

    if (updateProjectDto.id_client) {
      updateData.id_client = new Types.ObjectId(updateProjectDto.id_client);
    }

    if (updateProjectDto.agent_affectes) {
      updateData.agent_affectes = updateProjectDto.agent_affectes.map(
        (agentId) => new Types.ObjectId(agentId),
      );
    }

    const project = await this.projectModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }
}