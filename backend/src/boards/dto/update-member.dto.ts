import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BoardMemberRoleInput } from './add-member.dto';

export class UpdateMemberDto {
  @ApiProperty({ enum: BoardMemberRoleInput, example: 'VIEWER' })
  @IsEnum(BoardMemberRoleInput, { message: 'Role must be EDITOR or VIEWER' })
  role: BoardMemberRoleInput;
}
