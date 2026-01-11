import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { PersonalTasksService } from './personal-tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PersonalTaskGuard } from './guards/personal-task.guard';
import { ManagerGuard } from 'src/auth/guards/manager.guard';
import { Request } from 'express';
import { CreateSubtaskDto } from './dto/create-subtask.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('personal/tasks')
@UseGuards(JwtAuthGuard)
export class PersonalTasksController {
  constructor(private readonly personalTasksService: PersonalTasksService) {}

  @Post()
  createPersonalTask(
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.createPersonalTask(
      req.user.userId,
      createTaskDto,
    );
  }

  @Post(':taskId/subtasks')
  createSubtask(
    @Param('taskId') taskId: string,
    @Body() createSubtaskDto: CreateSubtaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.createSubtask(
      taskId,
      req.user.userId,
      createSubtaskDto,
    );
  }

  @Get(':taskId/subtasks')
  getSubtasks(
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.getSubtasks(taskId, req.user.userId);
  }

  @Get()
  getMyTasks(@Req() req: AuthenticatedRequest, @Query() filters: any) {
    return this.personalTasksService.getUserPersonalTasks(
      req.user.userId,
      filters,
    );
  }

  @Get('stats')
  getMyStats(@Req() req: AuthenticatedRequest) {
    return this.personalTasksService.getPersonalTasksStats(req.user.userId);
  }

  @Get('user/:userId')
  @UseGuards(PersonalTaskGuard, ManagerGuard)
  getUserTasks(@Param('userId') userId: string, @Query() filters: any) {
    return this.personalTasksService.getUserPersonalTasks(userId, filters);
  }

  @Get(':taskId')
  getPersonalTask(
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.getPersonalTaskById(
      taskId,
      req.user.userId,
    );
  }

  @Put(':taskId')
  updatePersonalTask(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.updatePersonalTask(
      taskId,
      req.user.userId,
      updateTaskDto,
    );
  }

  @Delete(':taskId')
  deletePersonalTask(
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.deletePersonalTask(
      taskId,
      req.user.userId,
    );
  }

  /**
   * NOUVELLE ROUTE : Récupérer les tâches d'un utilisateur spécifique (admin/manager)
   */
  @Get('admin/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserTasksForAdmin(
    @Param('userId') userId: string,
    @Query() filters: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.getUserTasksForAdmin(
      userId,
      req.user.userId,
      req.user.role,
      filters,
    );
  }

  /**
   * NOUVELLE ROUTE : Récupérer les sous-tâches d'un utilisateur (admin/manager)
   */
  @Get('admin/:taskId/subtasks')
  @UseGuards(JwtAuthGuard)
  async getSubtasksForAdmin(
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.personalTasksService.getSubtasksForAdmin(
      taskId,
      req.user.userId,
      req.user.role,
    );
  }
}
