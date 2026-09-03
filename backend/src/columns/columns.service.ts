import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { BoardsService } from '../boards/boards.service';

@Injectable()
export class ColumnsService {
  constructor(
    private prisma: PrismaService,
    private boardsService: BoardsService,
  ) {}

  async create(boardId: string, userId: string, dto: CreateColumnDto) {
    await this.boardsService.verifyUserPermission(boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    let order = dto.order;
    if (order === undefined || order === null) {
      const lastColumn = await this.prisma.column.findFirst({
        where: { boardId },
        orderBy: { order: 'desc' },
      });
      order = lastColumn ? lastColumn.order + 1 : 0;
    }

    return this.prisma.column.create({
      data: {
        title: dto.title.trim(),
        order,
        boardId,
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async update(columnId: string, userId: string, dto: UpdateColumnDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.verifyUserPermission(column.boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    return this.prisma.column.update({
      where: { id: columnId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async delete(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.verifyUserPermission(column.boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    await this.prisma.column.delete({
      where: { id: columnId },
    });

    return { message: 'Column deleted successfully' };
  }

  async reorder(boardId: string, userId: string, dto: ReorderColumnsDto) {
    await this.boardsService.verifyUserPermission(boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
    ]);

    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.columns) {
        await tx.column.updateMany({
          where: {
            id: item.id,
            boardId,
          },
          data: {
            order: item.order,
          },
        });
      }

      return tx.column.findMany({
        where: { boardId },
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }
}
