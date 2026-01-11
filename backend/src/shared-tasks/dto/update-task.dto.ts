import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    start_date: any;
    end_date: any;
    assignees: any;
    sub_tasks: any;
    project_id: any;
}