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
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({ status: 201, description: 'Board created with default columns' })
  async create(@GetUser('id') userId: string, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all boards accessible by the current user' })
  @ApiResponse({ status: 200, description: 'List of boards' })
  async findAll(@GetUser('id') userId: string) {
    return this.boardsService.findAllForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get board details with columns, tasks, and members' })
  @ApiResponse({ status: 200, description: 'Board details' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  async findOne(@Param('id') boardId: string, @GetUser('id') userId: string) {
    return this.boardsService.findOne(boardId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update board title or description' })
  @ApiResponse({ status: 200, description: 'Board updated' })
  async update(
    @Param('id') boardId: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.update(boardId, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a board (Owner only)' })
  @ApiResponse({ status: 200, description: 'Board deleted' })
  async delete(@Param('id') boardId: string, @GetUser('id') userId: string) {
    return this.boardsService.delete(boardId, userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add/invite a member to the board' })
  @ApiResponse({ status: 201, description: 'Member added' })
  async addMember(
    @Param('id') boardId: string,
    @GetUser('id') userId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.boardsService.addMember(boardId, userId, dto);
  }

  @Patch(':id/members/:targetUserId')
  @ApiOperation({ summary: 'Update a member role (Owner only)' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async updateMemberRole(
    @Param('id') boardId: string,
    @GetUser('id') userId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.boardsService.updateMemberRole(boardId, userId, targetUserId, dto);
  }

  @Delete(':id/members/:targetUserId')
  @ApiOperation({ summary: 'Remove a member from the board' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('id') boardId: string,
    @GetUser('id') userId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.boardsService.removeMember(boardId, userId, targetUserId);
  }
}
