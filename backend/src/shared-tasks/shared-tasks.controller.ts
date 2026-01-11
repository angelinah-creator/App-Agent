import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { SharedTasksService } from './shared-tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SpacePermissionGuard } from '../space-permissions/guards/space-permission.guard';
import { Request } from 'express';
import { CreateSubtaskDto } from './dto/create-subtask.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('shared/spaces/:spaceId/tasks')
@UseGuards(JwtAuthGuard, SpacePermissionGuard)
export class SharedTasksController {
  constructor(private readonly sharedTasksService: SharedTasksService) {}

  @Post()
  async createSharedTask(
    @Param('spaceId') spaceId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.sharedTasksService.createSharedTask(spaceId, createTaskDto, req.user.userId, req.user.role);
  }

  @Post(':taskId/subtasks')
  async createSubtask(
    @Param('spaceId') spaceId: string,
    @Param('taskId') taskId: string,
    @Body() createSubtaskDto: CreateSubtaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.sharedTasksService.createSubtask(spaceId, taskId, createSubtaskDto, req.user.userId, req.user.role);
  }

  @Get(':taskId/subtasks')
  async getSubtasks(
    @Param('spaceId') spaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.sharedTasksService.getSubtasks(spaceId, taskId);
  }

  @Get()
  getSpaceTasks(@Param('spaceId') spaceId: string, @Query() filters: any) {
    return this.sharedTasksService.getSpaceTasks(spaceId, filters);
  }

  @Get('stats')
  getSpaceStats(@Param('spaceId') spaceId: string) {
    return this.sharedTasksService.getSpaceTasksStats(spaceId);
  }

  @Get(':taskId')
  getSharedTask(@Param('spaceId') spaceId: string, @Param('taskId') taskId: string) {
    return this.sharedTasksService.getSharedTaskById(taskId, spaceId);
  }

  @Put(':taskId')
  async updateSharedTask(
    @Param('spaceId') spaceId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.sharedTasksService.updateSharedTask(taskId, spaceId, updateTaskDto, req.user.userId, req.user.role);
  }

  @Delete(':taskId')
  async deleteSharedTask(
    @Param('spaceId') spaceId: string,
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.sharedTasksService.deleteSharedTask(taskId, spaceId, req.user.userId, req.user.role);
    return { message: 'Tâche supprimée avec succès' };
  }
}