import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email for board collaboration' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (name or email)' })
  @ApiResponse({ status: 200, description: 'List of matching users' })
  async search(@Query('q') q: string, @GetUser('id') currentUserId: string) {
    return this.usersService.searchUsers(q, currentUserId);
  }
}
