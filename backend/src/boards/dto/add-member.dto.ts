import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export enum BoardMemberRoleInput {
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export class AddMemberDto {
  @ApiProperty({ example: 'collaborator@example.com' })
  @IsEmail({}, { message: 'Valid collaborator email is required' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: BoardMemberRoleInput, example: 'EDITOR' })
  @IsEnum(BoardMemberRoleInput, { message: 'Role must be EDITOR or VIEWER' })
  role: BoardMemberRoleInput;
}
