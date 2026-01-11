import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PersonalTask,
  PersonalTaskDocument,
  TaskPriority,
  TaskStatus,
} from './schemas/personal-task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';

@Injectable()
export class PersonalTasksService {
  constructor(
    @InjectModel(PersonalTask.name)
    private personalTaskModel: Model<PersonalTaskDocument>,
  ) {}

  async createPersonalTask(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<PersonalTaskDocument> {
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
      personalUserId: new Types.ObjectId(userId),
      assignees: [new Types.ObjectId(userId)], // Toujours assignée au propriétaire
    };

    // Convertir les IDs des sous-tâches
    if (createTaskDto.sub_tasks) {
      taskData.sub_tasks = createTaskDto.sub_tasks.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (createTaskDto.project_id) {
      taskData.project_id = new Types.ObjectId(createTaskDto.project_id);
    }

    const task = new this.personalTaskModel(taskData);
    return task.save();
  }

  async createSubtask(
    parentTaskId: string,
    userId: string,
    createSubtaskDto: CreateSubtaskDto,
  ): Promise<PersonalTaskDocument> {
    // Récupérer la tâche parente
    const parentTask = await this.personalTaskModel.findById(parentTaskId);

    if (!parentTask) {
      throw new NotFoundException('Tâche parente non trouvée');
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (parentTask.personalUserId.toString() !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas créer de sous-tâche pour cette tâche',
      );
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
      personalUserId: new Types.ObjectId(userId),
      assignees: [new Types.ObjectId(userId)], // Assignée au créateur
      parentTaskId: new Types.ObjectId(parentTaskId),
      status: parentTask.status, // Hérite du statut du parent
      project_id: parentTask.project_id, // Hérite du projet
      end_date: parentTask.end_date, // Hérite de la deadline
      priority: TaskPriority.NORMALE, // Pas d'héritage de priorité
    };

    const subtask = new this.personalTaskModel(subtaskData);
    const savedSubtask = await subtask.save();

    // Ajouter la sous-tâche à la liste de la tâche parente
    await this.personalTaskModel.findByIdAndUpdate(parentTaskId, {
      $addToSet: { sub_tasks: savedSubtask._id },
    });

    return savedSubtask;
  }

  async getSubtasks(
    parentTaskId: string,
    userId: string,
  ): Promise<PersonalTaskDocument[]> {
    const parentTask = await this.getPersonalTaskById(parentTaskId, userId);

    if (!parentTask) {
      throw new NotFoundException('Tâche parente non trouvée');
    }

    // Récupérer toutes les sous-tâches avec populate des assignees
    return this.personalTaskModel
      .find({
        parentTaskId: new Types.ObjectId(parentTaskId),
        personalUserId: new Types.ObjectId(userId),
      })
      .populate('assignees', 'nom prenoms email') // ICI: Ajouter populate
      .populate('project_id', 'name description')
      .sort({ createdAt: 1 })
      .exec();
  }

  async updateParentTaskProperties(
    taskId: string,
    updateData: Partial<PersonalTask>,
  ): Promise<void> {
    // Mettre à jour toutes les sous-tâches avec les nouvelles propriétés
    await this.personalTaskModel.updateMany(
      {
        parentTaskId: new Types.ObjectId(taskId),
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

  async updatePersonalTask(
    taskId: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<PersonalTaskDocument> {
    const task = await this.getPersonalTaskById(taskId, userId);

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

    // Convertir les IDs des sous-tâches
    if (updateTaskDto.sub_tasks) {
      updateData.sub_tasks = updateTaskDto.sub_tasks.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (updateTaskDto.project_id) {
      updateData.project_id = new Types.ObjectId(updateTaskDto.project_id);
    }

    const updated = await this.personalTaskModel
      .findByIdAndUpdate(taskId, updateData, { new: true })
      .populate('project_id', 'name description')
      .populate('sub_tasks')
      .populate('assignees', 'nom prenoms email')
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
      await this.updateParentTaskProperties(taskId, updated);
    }

    return updated;
  }

  async deletePersonalTask(taskId: string, userId: string): Promise<void> {
    const task = await this.getPersonalTaskById(taskId, userId);

    // Supprimer toutes les sous-tâches
    if (task.sub_tasks && task.sub_tasks.length > 0) {
      await this.personalTaskModel.deleteMany({
        parentTaskId: new Types.ObjectId(taskId),
        personalUserId: new Types.ObjectId(userId),
      });
    }

    // Si c'est une sous-tâche, la retirer de la liste de la tâche parente
    if (task.parentTaskId) {
      await this.personalTaskModel.findByIdAndUpdate(task.parentTaskId, {
        $pull: { sub_tasks: task._id },
      });
    }

    const result = await this.personalTaskModel
      .findByIdAndDelete(taskId)
      .exec();
    if (!result) {
      throw new NotFoundException('Tâche non trouvée');
    }
  }

  async getUserPersonalTasks(
    userId: string,
    filters?: any,
  ): Promise<PersonalTaskDocument[]> {
    const query: any = {
      personalUserId: new Types.ObjectId(userId),
      parentTaskId: null, // Ne retourner que les tâches parentes par défaut
    };

    // Appliquer les filtres
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

    return this.personalTaskModel
      .find(query)
      .populate('project_id', 'name description')
      .populate('sub_tasks')
      .populate('assignees', 'nom prenoms email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPersonalTaskById(
    taskId: string,
    userId: string,
  ): Promise<PersonalTaskDocument> {
    const task = await this.personalTaskModel
      .findById(taskId)
      .populate('project_id', 'name description')
      .populate('sub_tasks')
      .populate('assignees', 'nom prenoms email')
      .exec();

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (task.personalUserId.toString() !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette tâche');
    }

    return task;
  }

  async getPersonalTasksStats(userId: string): Promise<any> {
    const stats = await this.personalTaskModel.aggregate([
      {
        $match: { personalUserId: new Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await this.personalTaskModel.countDocuments({
      personalUserId: new Types.ObjectId(userId),
    });
    const completed = await this.personalTaskModel.countDocuments({
      personalUserId: new Types.ObjectId(userId),
      status: TaskStatus.TERMINEE,
    });

    return {
      total,
      completed,
      byStatus: stats,
    };
  }

  async getUserTasksForAdmin(
    userId: string,
    requesterId: string,
    requesterRole: string,
    filters?: any,
  ): Promise<PersonalTaskDocument[]> {
    // Vérifier que le requester est admin ou manager
    if (requesterRole !== 'admin' && requesterRole !== 'manager') {
      throw new ForbiddenException(
        'Seuls les admins et managers peuvent voir les tâches des autres utilisateurs',
      );
    }

    const query: any = {
      personalUserId: new Types.ObjectId(userId),
      parentTaskId: null, // Ne retourner que les taches parentes
    };

    // Appliquer les filtres
    if (filters?.project_id) {
      query.project_id = new Types.ObjectId(filters.project_id);
    }
    if (filters?.priority) {
      query.priority = filters.priority;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.start_date) {
      query.start_date = { $gte: new Date(filters.start_date) };
    }
    if (filters?.end_date) {
      query.end_date = { $lte: new Date(filters.end_date) };
    }

    return this.personalTaskModel
      .find(query)
      .populate('project_id', 'name description')
      .populate('sub_tasks')
      .populate('assignees', 'nom prenoms email')
      .populate('personalUserId', 'nom prenoms email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSubtasksForAdmin(
    parentTaskId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<PersonalTaskDocument[]> {
    // Vérifier que le requester est admin ou manager
    if (requesterRole !== 'admin' && requesterRole !== 'manager') {
      throw new ForbiddenException(
        'Seuls les admins et managers peuvent voir les sous-tâches des autres utilisateurs',
      );
    }

    // Récupérer la tâche parente
    const parentTask = await this.personalTaskModel.findById(parentTaskId);
    if (!parentTask) {
      throw new NotFoundException('Tâche parente non trouvée');
    }

    return this.personalTaskModel
      .find({
        parentTaskId: new Types.ObjectId(parentTaskId),
        personalUserId: parentTask.personalUserId,
      })
      .populate('assignees', 'nom prenoms email')
      .populate('project_id', 'name description')
      .sort({ createdAt: 1 })
      .exec();
  }
}
