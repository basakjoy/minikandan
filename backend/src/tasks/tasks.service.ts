import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { BoardsService } from '../boards/boards.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private boardsService: BoardsService,
  ) {}

  async create(columnId: string, userId: string, dto: CreateTaskDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.verifyUserPermission(column.boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    if (dto.assigneeId) {
      await this.verifyAssigneeIsBoardMember(column.boardId, dto.assigneeId);
    }

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
    });
    const order = lastTask ? lastTask.order + 1 : 0;

    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priority: dto.priority || 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        order,
        columnId,
        assigneeId: dto.assigneeId || null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findOne(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.verifyUserPermission(task.column.boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
      BoardRole.VIEWER,
    ]);

    return task;
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.verifyUserPermission(task.column.boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    if (dto.assigneeId) {
      await this.verifyAssigneeIsBoardMember(task.column.boardId, dto.assigneeId);
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId || null }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        column: true,
      },
    });
  }

  async delete(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.verifyUserPermission(task.column.boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: { id: taskId },
      });

      const remainingTasks = await tx.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      });

      for (let i = 0; i < remainingTasks.length; i++) {
        if (remainingTasks[i].order !== i) {
          await tx.task.update({
            where: { id: remainingTasks[i].id },
            data: { order: i },
          });
        }
      }
    });

    return { message: 'Task deleted successfully' };
  }

  /**
   * Task Movement API:
   * Reorders a task within the same column or moves across columns to a specific position index.
   * Handles consistency and concurrency inside a Prisma transaction.
   */
  async move(taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          include: { board: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const sourceColumnId = task.columnId;
    const sourceBoardId = task.column.boardId;

    const targetColumn = await this.prisma.column.findUnique({
      where: { id: dto.targetColumnId },
      include: { board: true },
    });

    if (!targetColumn) {
      throw new NotFoundException('Target column not found');
    }

    const targetBoardId = targetColumn.boardId;

    // Verify user permission on source board
    await this.boardsService.verifyUserPermission(sourceBoardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    // Prevent unauthorized cross-board moves
    if (sourceBoardId !== targetBoardId) {
      await this.boardsService.verifyUserPermission(targetBoardId, userId, [
        BoardRole.OWNER,
        BoardRole.EDITOR,
      ]);
    }

    return this.prisma.$transaction(async (tx) => {
      if (sourceColumnId === dto.targetColumnId) {
        // Reordering within the same column
        const columnTasks = await tx.task.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { order: 'asc' },
        });

        // Filter out the moving task
        const otherTasks = columnTasks.filter((t) => t.id !== taskId);

        // Clamp target position to valid bounds
        const targetIndex = Math.max(0, Math.min(dto.targetPosition, otherTasks.length));

        // Insert moving task at the new target index
        otherTasks.splice(targetIndex, 0, task);

        // Update orders of all tasks in the column sequentially
        for (let i = 0; i < otherTasks.length; i++) {
          await tx.task.update({
            where: { id: otherTasks[i].id },
            data: { order: i },
          });
        }
      } else {
        // Moving across different columns
        // 1. Reindex source column
        const sourceTasks = await tx.task.findMany({
          where: {
            columnId: sourceColumnId,
            id: { not: taskId },
          },
          orderBy: { order: 'asc' },
        });

        for (let i = 0; i < sourceTasks.length; i++) {
          if (sourceTasks[i].order !== i) {
            await tx.task.update({
              where: { id: sourceTasks[i].id },
              data: { order: i },
            });
          }
        }

        // 2. Fetch target column tasks
        const targetTasks = await tx.task.findMany({
          where: { columnId: dto.targetColumnId },
          orderBy: { order: 'asc' },
        });

        // Clamp target position
        const targetIndex = Math.max(0, Math.min(dto.targetPosition, targetTasks.length));

        // Insert into target list
        targetTasks.splice(targetIndex, 0, {
          ...task,
          columnId: dto.targetColumnId,
        });

        // Update all target column tasks
        for (let i = 0; i < targetTasks.length; i++) {
          if (targetTasks[i].id === taskId) {
            await tx.task.update({
              where: { id: taskId },
              data: {
                columnId: dto.targetColumnId,
                order: i,
              },
            });
          } else {
            await tx.task.update({
              where: { id: targetTasks[i].id },
              data: { order: i },
            });
          }
        }
      }

      // Return refreshed task with relations
      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          column: true,
        },
      });
    });
  }

  private async verifyAssigneeIsBoardMember(boardId: string, assigneeId: string) {
    const isMember = await this.prisma.boardMember.findFirst({
      where: {
        boardId,
        userId: assigneeId,
      },
    });

    const isOwner = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: assigneeId,
      },
    });

    if (!isMember && !isOwner) {
      throw new BadRequestException('Assigned user must be a member or owner of the board');
    }
  }
}
