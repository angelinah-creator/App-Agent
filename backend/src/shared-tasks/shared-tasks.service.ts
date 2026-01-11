import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SharedTask,
  SharedTaskDocument,
  TaskPriority,
  TaskStatus,
} from './schemas/shared-task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SpacePermissionsService } from '../space-permissions/space-permissions.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';

@Injectable()
export class SharedTasksService {
  constructor(
    @InjectModel(SharedTask.name)
    private sharedTaskModel: Model<SharedTaskDocument>,
    private spacePermissionsService: SpacePermissionsService,
  ) {}

  async createSharedTask(
    spaceId: string,
    createTaskDto: CreateTaskDto,
    createdBy: string,
    userRole?: string,
  ): Promise<SharedTaskDocument> {
    // Vérifier que l'utilisateur peut éditer
    const canEdit = await this.spacePermissionsService.canUserEdit(
      spaceId,
      createdBy,
      userRole,
    );
    if (!canEdit) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour créer des tâches dans cet espace",
      );
    }

    // Valider les dates
    if (createTaskDto.start_date && createTaskDto.end_date) {
      const startDate = new Date(createTaskDto.start_date);
      const endDate = new Date(createTaskDto.end_date);

      if (startDate > endDate) {
        throw new BadRequestException(
          'La date de début ne peut pas être après la date de fin',
        );
      }
    }

    const taskData: any = {
      ...createTaskDto,
      spaceId: new Types.ObjectId(spaceId),
      createdBy: new Types.ObjectId(createdBy),
    };

    // Convertir les IDs
    if (createTaskDto.assignees) {
      taskData.assignees = createTaskDto.assignees.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (createTaskDto.sub_tasks) {
      taskData.sub_tasks = createTaskDto.sub_tasks.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (createTaskDto.project_id) {
      taskData.project_id = new Types.ObjectId(createTaskDto.project_id);
    }

    const task = new this.sharedTaskModel(taskData);
    return task.save();
  }

  async createSubtask(
    spaceId: string,
    parentTaskId: string,
    createSubtaskDto: CreateSubtaskDto,
    createdBy: string,
    userRole?: string,
  ): Promise<SharedTaskDocument> {
    // Vérifier les permissions
    const canEdit = await this.spacePermissionsService.canUserEdit(
      spaceId,
      createdBy,
      userRole,
    );
    if (!canEdit) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour créer des sous-tâches",
      );
    }

    // Récupérer la tâche parente
    const parentTask = await this.sharedTaskModel.findById(parentTaskId);

    if (!parentTask) {
      throw new NotFoundException('Tâche parente non trouvée');
    }

    // Vérifier que la tâche appartient à l'espace
    if (parentTask.spaceId.toString() !== spaceId) {
      throw new ForbiddenException("Cette tâche n'appartient pas à cet espace");
    }

    // Empêcher de créer une sous-tâche pour une sous-tâche
    if (parentTask.parentTaskId) {
      throw new BadRequestException(
        'Une sous-tâche ne peut pas avoir de sous-tâches',
      );
    }

    // Créer la sous-tâche avec héritage
    const subtaskData: any = {
      ...createSubtaskDto,
      spaceId: new Types.ObjectId(spaceId),
      createdBy: new Types.ObjectId(createdBy),
      parentTaskId: new Types.ObjectId(parentTaskId),
      status: parentTask.status, // Hérite du statut du parent
      project_id: parentTask.project_id, // Hérite du projet
      end_date: parentTask.end_date, // Hérite de la deadline
      priority: TaskPriority.NORMALE, // Pas d'héritage de priorité
    };

    // Convertir les assignees si fournis
    if (createSubtaskDto.assignees) {
      subtaskData.assignees = createSubtaskDto.assignees.map(
        (id) => new Types.ObjectId(id),
      );
    }

    const subtask = new this.sharedTaskModel(subtaskData);
    const savedSubtask = await subtask.save();

    // Ajouter la sous-tâche à la liste de la tâche parente
    await this.sharedTaskModel.findByIdAndUpdate(parentTaskId, {
      $addToSet: { sub_tasks: savedSubtask._id },
    });

    return savedSubtask;
  }

  async getSubtasks(
    spaceId: string,
    parentTaskId: string,
  ): Promise<SharedTaskDocument[]> {
    const parentTask = await this.getSharedTaskById(parentTaskId, spaceId);

    if (!parentTask) {
      throw new NotFoundException('Tâche parente non trouvée');
    }

    return this.sharedTaskModel
      .find({
        parentTaskId: new Types.ObjectId(parentTaskId),
        spaceId: new Types.ObjectId(spaceId),
      })
      .populate('assignees', 'nom prenoms email') // ICI: Ajouter populate
      .populate('project_id', 'name description')
      .sort({ createdAt: 1 })
      .exec();
  }

  async updateParentTaskProperties(
    taskId: string,
    spaceId: string,
    updateData: Partial<SharedTask>,
  ): Promise<void> {
    await this.sharedTaskModel.updateMany(
      {
        parentTaskId: new Types.ObjectId(taskId),
        spaceId: new Types.ObjectId(spaceId),
      },
      {
        $set: {
          project_id: updateData.project_id,
          end_date: updateData.end_date,
          status: updateData.status,
        },
      },
    );
  }

  async updateSharedTask(
    taskId: string,
    spaceId: string,
    updateTaskDto: UpdateTaskDto,
    requestedBy: string,
    userRole?: string,
  ): Promise<SharedTaskDocument> {
    const task = await this.getSharedTaskById(taskId, spaceId);

    // Vérifier que l'utilisateur peut éditer
    const canEdit = await this.spacePermissionsService.canUserEdit(
      spaceId,
      requestedBy,
      userRole,
    );
    if (!canEdit) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour modifier des tâches dans cet espace",
      );
    }

    // Valider les dates
    if (updateTaskDto.start_date && updateTaskDto.end_date) {
      const startDate = new Date(updateTaskDto.start_date);
      const endDate = new Date(updateTaskDto.end_date);

      if (startDate > endDate) {
        throw new BadRequestException(
          'La date de début ne peut pas être après la date de fin',
        );
      }
    }

    const updateData: any = { ...updateTaskDto };

    // Convertir les IDs
    if (updateTaskDto.assignees) {
      updateData.assignees = updateTaskDto.assignees.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (updateTaskDto.sub_tasks) {
      updateData.sub_tasks = updateTaskDto.sub_tasks.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (updateTaskDto.project_id) {
      updateData.project_id = new Types.ObjectId(updateTaskDto.project_id);
    }

    const updated = await this.sharedTaskModel
      .findByIdAndUpdate(taskId, updateData, { new: true })
      .populate('assignees', 'nom prenoms email')
      .populate('project_id', 'name description')
      .populate('sub_tasks')
      .populate('createdBy', 'nom prenoms email')
      .exec();

    if (!updated) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Si c'est une tâche parente et que le projet ou la deadline a changé, mettre à jour les sous-tâches
    if (
      (updateTaskDto.project_id ||
        updateTaskDto.end_date ||
        updateTaskDto.status) &&
      !task.parentTaskId
    ) {
      await this.updateParentTaskProperties(taskId, spaceId, updated);
    }

    return updated;
  }

  async deleteSharedTask(
    taskId: string,
    spaceId: string,
    requestedBy: string,
    userRole?: string,
  ): Promise<void> {
    const task = await this.getSharedTaskById(taskId, spaceId);

    // Vérifier que l'utilisateur peut éditer
    const canEdit = await this.spacePermissionsService.canUserEdit(
      spaceId,
      requestedBy,
      userRole,
    );
    if (!canEdit) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour supprimer des tâches dans cet espace",
      );
    }

    // Supprimer toutes les sous-tâches
    if (task.sub_tasks && task.sub_tasks.length > 0) {
      await this.sharedTaskModel.deleteMany({
        parentTaskId: new Types.ObjectId(taskId),
        spaceId: new Types.ObjectId(spaceId),
      });
    }

    // Si c'est une sous-tâche, la retirer de la liste de la tâche parente
    if (task.parentTaskId) {
      await this.sharedTaskModel.findByIdAndUpdate(task.parentTaskId, {
        $pull: { sub_tasks: task._id },
      });
    }

    const result = await this.sharedTaskModel.findByIdAndDelete(taskId).exec();
    if (!result) {
      throw new NotFoundException('Tâche non trouvée');
    }
  }

  async getSpaceTasks(
    spaceId: string,
    filters?: any,
  ): Promise<SharedTaskDocument[]> {
    const query: any = {
      spaceId: new Types.ObjectId(spaceId),
      parentTaskId: null, // Ne retourner que les tâches parentes par défaut
    };

    // Appliquer les filtres
    if (filters.assignee) {
      query.assignees = new Types.ObjectId(filters.assignee);
    }
    if (filters.project_id) {
      query.project_id = new Types.ObjectId(filters.project_id);
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.start_date) {
      query.start_date = { $gte: new Date(filters.start_date) };
    }
    if (filters.end_date) {
      query.end_date = { $lte: new Date(filters.end_date) };
    }

    return this.sharedTaskModel
      .find(query)
      .populate('assignees', 'nom prenoms email')
      .populate('project_id', 'name description')
      .populate('sub_tasks')
      .populate('createdBy', 'nom prenoms email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSharedTaskById(
    taskId: string,
    spaceId: string,
  ): Promise<SharedTaskDocument> {
    const task = await this.sharedTaskModel
      .findById(taskId)
      .populate('assignees', 'nom prenoms email')
      .populate('project_id', 'name description')
      .populate('sub_tasks')
      .populate('createdBy', 'nom prenoms email')
      .exec();

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Vérifier que la tâche appartient à l'espace
    if (task.spaceId.toString() !== spaceId) {
      throw new ForbiddenException("Cette tâche n'appartient pas à cet espace");
    }

    return task;
  }

  async getSpaceTasksStats(spaceId: string): Promise<any> {
    const stats = await this.sharedTaskModel.aggregate([
      {
        $match: { spaceId: new Types.ObjectId(spaceId) },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await this.sharedTaskModel.countDocuments({
      spaceId: new Types.ObjectId(spaceId),
    });
    const completed = await this.sharedTaskModel.countDocuments({
      spaceId: new Types.ObjectId(spaceId),
      status: TaskStatus.TERMINEE,
    });

    return {
      total,
      completed,
      byStatus: stats,
    };
  }
}
