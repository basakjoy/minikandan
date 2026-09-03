import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('columns/:columnId/tasks')
  @ApiOperation({ summary: 'Create a new task in a column' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(
    @Param('columnId') columnId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(columnId, userId, dto);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task details by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved' })
  async findOne(@Param('id') taskId: string, @GetUser('id') userId: string) {
    return this.tasksService.findOne(taskId, userId);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task properties' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  async update(
    @Param('id') taskId: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(taskId, userId, dto);
  }

  @Patch('tasks/:id/move')
  @ApiOperation({ summary: 'Move task across columns or reorder within the same column' })
  @ApiResponse({ status: 200, description: 'Task moved and reindexed' })
  async move(
    @Param('id') taskId: string,
    @GetUser('id') userId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasksService.move(taskId, userId, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  async delete(@Param('id') taskId: string, @GetUser('id') userId: string) {
    return this.tasksService.delete(taskId, userId);
  }
}
