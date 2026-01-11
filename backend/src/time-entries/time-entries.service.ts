import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TimeEntry,
  TimeEntryDocument,
  TimerStatus,
} from './schemas/time-entry.schema';
import {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  StartTimerDto,
  SyncOfflineEntriesDto,
  GetReportDto,
} from './dto/time-entry.dtos';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

@Injectable()
export class TimeEntriesService {
  constructor(
    @InjectModel(TimeEntry.name)
    private timeEntryModel: Model<TimeEntryDocument>,
  ) {}

  // Démarrer le timer
  async startTimer(userId: string, startTimerDto: StartTimerDto): Promise<TimeEntryDocument> {
    // Vérifier qu'il n'y a pas déjà un timer actif
    const activeTimer = await this.timeEntryModel.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: [TimerStatus.RUNNING, TimerStatus.PAUSED] },
    });

    if (activeTimer) {
      throw new ConflictException('Un timer est déjà actif. Arrêtez-le d\'abord.');
    }

    const timeEntry = new this.timeEntryModel({
      userId: new Types.ObjectId(userId),
      projectId: startTimerDto.projectId ? new Types.ObjectId(startTimerDto.projectId) : undefined,
      personalTaskId: startTimerDto.personalTaskId ? new Types.ObjectId(startTimerDto.personalTaskId) : undefined,
      sharedTaskId: startTimerDto.sharedTaskId ? new Types.ObjectId(startTimerDto.sharedTaskId) : undefined,
      description: startTimerDto.description,
      startTime: new Date(),
      date: startOfDay(new Date()),
      status: TimerStatus.RUNNING,
      duration: 0,
    });

    return timeEntry.save();
  }

  // Mettre en pause
  async pauseTimer(userId: string): Promise<TimeEntryDocument> {
    const activeTimer = await this.getActiveTimer(userId);

    if (activeTimer.status !== TimerStatus.RUNNING) {
      throw new BadRequestException('Le timer n\'est pas en cours d\'exécution');
    }

    const now = new Date();
    const duration = activeTimer.duration + Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);

    activeTimer.status = TimerStatus.PAUSED;
    activeTimer.duration = duration;
    activeTimer.pausedAt.push(now);

    return activeTimer.save();
  }

  // Reprendre
  async resumeTimer(userId: string): Promise<TimeEntryDocument> {
    const activeTimer = await this.getActiveTimer(userId);

    if (activeTimer.status !== TimerStatus.PAUSED) {
      throw new BadRequestException('Le timer n\'est pas en pause');
    }

    const now = new Date();
    activeTimer.status = TimerStatus.RUNNING;
    activeTimer.resumedAt.push(now);
    activeTimer.startTime = now;

    return activeTimer.save();
  }

  // Arrêter le timer
  async stopTimer(userId: string): Promise<TimeEntryDocument> {
    const activeTimer = await this.getActiveTimer(userId);

    const now = new Date();
    let duration = activeTimer.duration;

    if (activeTimer.status === TimerStatus.RUNNING) {
      duration += Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
    }

    activeTimer.status = TimerStatus.STOPPED;
    activeTimer.duration = duration;
    activeTimer.endTime = now;

    return activeTimer.save();
  }

  // Récupérer le timer actif
  async getActiveTimer(userId: string): Promise<TimeEntryDocument> {
    const activeTimer = await this.timeEntryModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: [TimerStatus.RUNNING, TimerStatus.PAUSED] },
      })
      .populate('projectId', 'name')
      .populate('personalTaskId', 'title')
      .populate('sharedTaskId', 'title');

    if (!activeTimer) {
      throw new NotFoundException('Aucun timer actif');
    }

    return activeTimer;
  }

  // Créer une entrée manuelle
  async createEntry(userId: string, createDto: CreateTimeEntryDto): Promise<TimeEntryDocument> {
    const timeEntry = new this.timeEntryModel({
      userId: new Types.ObjectId(userId),
      projectId: createDto.projectId ? new Types.ObjectId(createDto.projectId) : undefined,
      personalTaskId: createDto.personalTaskId ? new Types.ObjectId(createDto.personalTaskId) : undefined,
      sharedTaskId: createDto.sharedTaskId ? new Types.ObjectId(createDto.sharedTaskId) : undefined,
      description: createDto.description,
      startTime: new Date(createDto.startTime),
      endTime: createDto.endTime ? new Date(createDto.endTime) : undefined,
      duration: createDto.duration || 0,
      status: createDto.status || TimerStatus.STOPPED,
      date: startOfDay(new Date(createDto.startTime)),
      syncedFromOffline: createDto.syncedFromOffline || false,
      offlineId: createDto.offlineId,
    });

    return timeEntry.save();
  }

  // Mettre à jour une entrée
  async updateEntry(userId: string, entryId: string, updateDto: UpdateTimeEntryDto): Promise<TimeEntryDocument> {
    const entry = await this.timeEntryModel.findOne({
      _id: entryId,
      userId: new Types.ObjectId(userId),
    });

    if (!entry) {
      throw new NotFoundException('Entrée non trouvée');
    }

    Object.assign(entry, updateDto);

    if (updateDto.startTime) {
      entry.startTime = new Date(updateDto.startTime);
      entry.date = startOfDay(new Date(updateDto.startTime));
    }

    if (updateDto.endTime) {
      entry.endTime = new Date(updateDto.endTime);
    }

    return entry.save();
  }

  // Supprimer une entrée
  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const result = await this.timeEntryModel.findOneAndDelete({
      _id: entryId,
      userId: new Types.ObjectId(userId),
    });

    if (!result) {
      throw new NotFoundException('Entrée non trouvée');
    }
  }

  // Récupérer les entrées d'une période
  async getEntries(userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntryDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate),
      };
    }

    return this.timeEntryModel
      .find(query)
      .populate('projectId', 'name description')
      .populate('personalTaskId', 'title')
      .populate('sharedTaskId', 'title')
      .sort({ date: -1, startTime: -1 })
      .exec();
  }

  // Synchroniser les entrées hors ligne
  async syncOfflineEntries(userId: string, syncDto: SyncOfflineEntriesDto): Promise<TimeEntryDocument[]> {
    const syncedEntries: TimeEntryDocument[] = [];

    for (const entryDto of syncDto.entries) {
      // Vérifier si l'entrée n'existe pas déjà
      if (entryDto.offlineId) {
        const existing = await this.timeEntryModel.findOne({
          userId: new Types.ObjectId(userId),
          offlineId: entryDto.offlineId,
        });

        if (existing) {
          continue; // Skip si déjà synchronisé
        }
      }

      const entry = await this.createEntry(userId, {
        ...entryDto,
        syncedFromOffline: true,
      });

      syncedEntries.push(entry);
    }

    return syncedEntries;
  }

  // Générer un rapport
  async getReport(reportDto: GetReportDto, requesterId: string, requesterRole: string) {
    const userId = reportDto.userId || requesterId;

    // Vérifier les permissions
    if (reportDto.userId && reportDto.userId !== requesterId) {
      if (requesterRole !== 'admin' && requesterRole !== 'manager') {
        throw new BadRequestException('Accès non autorisé aux rapports d\'autres utilisateurs');
      }
    }

    const startDate = reportDto.startDate ? new Date(reportDto.startDate) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = reportDto.endDate ? new Date(reportDto.endDate) : endOfWeek(new Date(), { weekStartsOn: 1 });

    const query: any = {
      userId: new Types.ObjectId(userId),
      date: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate),
      },
      status: TimerStatus.STOPPED,
    };

    if (reportDto.projectId) {
      query.projectId = new Types.ObjectId(reportDto.projectId);
    }

    const entries = await this.timeEntryModel
      .find(query)
      .populate('projectId', 'name description')
      .populate('personalTaskId', 'title')
      .populate('sharedTaskId', 'title')
      .sort({ date: 1, startTime: 1 })
      .exec();

    // Calculer les statistiques
    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);

    // Grouper par projet
    const byProject = new Map<string, { name: string; duration: number; entries: any[] }>();
    
    entries.forEach(entry => {
      const projectKey = entry.projectId ? (entry.projectId as any)._id.toString() : 'no-project';
      const projectName = entry.projectId ? (entry.projectId as any).name : 'Sans projet';

      if (!byProject.has(projectKey)) {
        byProject.set(projectKey, { name: projectName, duration: 0, entries: [] });
      }

      const project = byProject.get(projectKey)!;
      project.duration += entry.duration;
      project.entries.push(entry);
    });

    // Grouper par description
    const byDescription = new Map<string, number>();
    
    entries.forEach(entry => {
      const desc = entry.description || 'Sans description';
      byDescription.set(desc, (byDescription.get(desc) || 0) + entry.duration);
    });

    // Grouper par jour
    const byDay = new Map<string, number>();
    
    entries.forEach(entry => {
      const day = entry.date.toISOString().split('T')[0];
      byDay.set(day, (byDay.get(day) || 0) + entry.duration);
    });

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalDuration,
      totalHours: totalDuration / 3600,
      entriesCount: entries.length,
      byProject: Array.from(byProject.entries()).map(([id, data]) => ({
        projectId: id !== 'no-project' ? id : null,
        projectName: data.name,
        duration: data.duration,
        hours: data.duration / 3600,
        percentage: (data.duration / totalDuration) * 100,
        entriesCount: data.entries.length,
      })),
      byDescription: Array.from(byDescription.entries()).map(([description, duration]) => ({
        description,
        duration,
        hours: duration / 3600,
        percentage: (duration / totalDuration) * 100,
      })),
      byDay: Array.from(byDay.entries()).map(([day, duration]) => ({
        day,
        duration,
        hours: duration / 3600,
      })),
      entries: entries.map(entry => ({
        _id: entry._id,
        projectId: entry.projectId ? (entry.projectId as any)._id : null,
        projectName: entry.projectId ? (entry.projectId as any).name : null,
        taskId: entry.personalTaskId || entry.sharedTaskId,
        taskTitle: entry.personalTaskId ? (entry.personalTaskId as any).title : entry.sharedTaskId ? (entry.sharedTaskId as any).title : null,
        description: entry.description,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        hours: entry.duration / 3600,
        date: entry.date,
      })),
    };
  }
}