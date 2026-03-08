// backend/src/shared-tasks/shared-tasks-user.controller.ts
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SharedTasksService } from './shared-tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { TaskStatus } from './schemas/shared-task.schema';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('shared/tasks')
@UseGuards(JwtAuthGuard)
export class SharedTasksUserController {
  constructor(private readonly sharedTasksService: SharedTasksService) {}

  @Get('my-assigned')
  async getMyAssignedTasks(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: TaskStatus,
  ) {
    return this.sharedTasksService.getMyAssignedTasks(req.user.userId, status);
  }
}