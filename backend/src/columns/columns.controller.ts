import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('columns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ColumnsController {
  constructor(private columnsService: ColumnsService) {}

  @Post('boards/:boardId/columns')
  @ApiOperation({ summary: 'Create a new column on a board' })
  @ApiResponse({ status: 201, description: 'Column created' })
  async create(
    @Param('boardId') boardId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.columnsService.create(boardId, userId, dto);
  }

  @Patch('columns/:id')
  @ApiOperation({ summary: 'Update column title or order' })
  @ApiResponse({ status: 200, description: 'Column updated' })
  async update(
    @Param('id') columnId: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnsService.update(columnId, userId, dto);
  }

  @Delete('columns/:id')
  @ApiOperation({ summary: 'Delete a column and its tasks' })
  @ApiResponse({ status: 200, description: 'Column deleted' })
  async delete(@Param('id') columnId: string, @GetUser('id') userId: string) {
    return this.columnsService.delete(columnId, userId);
  }

  @Patch('boards/:boardId/columns-reorder')
  @ApiOperation({ summary: 'Reorder columns on a board' })
  @ApiResponse({ status: 200, description: 'Columns reordered' })
  async reorder(
    @Param('boardId') boardId: string,
    @GetUser('id') userId: string,
    @Body() dto: ReorderColumnsDto,
  ) {
    return this.columnsService.reorder(boardId, userId, dto);
  }
}
