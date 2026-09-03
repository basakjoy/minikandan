import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmed = query.trim();
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { email: { contains: trimmed, mode: 'insensitive' } },
              { name: { contains: trimmed, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 10,
    });
  }
}
