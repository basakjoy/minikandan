import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBoardDto) {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: BoardRole.OWNER,
            },
          },
          columns: {
            create: [
              { title: 'To Do', order: 0 },
              { title: 'In Progress', order: 1 },
              { title: 'Done', order: 2 },
            ],
          },
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      return board;
    });
  }

  async findAllForUser(userId: string) {
    const boards = await this.prisma.board.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            columns: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return boards.map((board) => {
      const membership = board.members.find((m) => m.userId === userId);
      return {
        ...board,
        userRole: membership ? membership.role : null,
        isOwner: board.ownerId === userId,
      };
    });
  }

  async findOne(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const membership = board.members.find((m) => m.userId === userId);
    if (!membership && board.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return {
      ...board,
      userRole: membership?.role || (board.ownerId === userId ? BoardRole.OWNER : BoardRole.VIEWER),
      isOwner: board.ownerId === userId,
    };
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto) {
    await this.verifyUserPermission(boardId, userId, [BoardRole.OWNER, BoardRole.EDITOR]);

    return this.prisma.board.update({
      where: { id: boardId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async delete(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (board.ownerId !== userId) {
      throw new ForbiddenException('Only the board owner can delete this board');
    }

    await this.prisma.board.delete({
      where: { id: boardId },
    });

    return { message: 'Board deleted successfully' };
  }

  async addMember(boardId: string, currentUserId: string, dto: AddMemberDto) {
    await this.verifyUserPermission(boardId, currentUserId, [BoardRole.OWNER]);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!targetUser) {
      throw new NotFoundException(`No user found with email "${dto.email}"`);
    }

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (board.ownerId === targetUser.id) {
      throw new BadRequestException('The board owner already has full access');
    }

    const member = await this.prisma.boardMember.upsert({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUser.id,
        },
      },
      update: {
        role: dto.role as BoardRole,
      },
      create: {
        boardId,
        userId: targetUser.id,
        role: dto.role as BoardRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return member;
  }

  async updateMemberRole(
    boardId: string,
    currentUserId: string,
    targetUserId: string,
    dto: UpdateMemberDto,
  ) {
    await this.verifyUserPermission(boardId, currentUserId, [BoardRole.OWNER]);

    const member = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Board member not found');
    }

    if (member.role === BoardRole.OWNER) {
      throw new BadRequestException('Cannot change the role of the board owner');
    }

    return this.prisma.boardMember.update({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUserId,
        },
      },
      data: {
        role: dto.role as BoardRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeMember(boardId: string, currentUserId: string, targetUserId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const isOwner = board.ownerId === currentUserId;
    const isSelf = currentUserId === targetUserId;

    if (!isOwner && !isSelf) {
      throw new ForbiddenException('You do not have permission to remove this member');
    }

    if (targetUserId === board.ownerId) {
      throw new BadRequestException('The owner cannot be removed from the board');
    }

    await this.prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUserId,
        },
      },
    });

    return { message: 'Member removed successfully' };
  }

  async verifyUserPermission(
    boardId: string,
    userId: string,
    allowedRoles: BoardRole[],
  ): Promise<{ board: any; role: BoardRole }> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (board.ownerId === userId) {
      return { board, role: BoardRole.OWNER };
    }

    const member = board.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenException('You do not have access to this board');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return { board, role: member.role };
  }
}
