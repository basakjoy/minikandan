import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({ example: 'target-column-uuid', description: 'ID of the destination column' })
  @IsString()
  @IsNotEmpty({ message: 'targetColumnId is required' })
  targetColumnId: string;

  @ApiProperty({ example: 0, description: 'Target 0-based position index within the destination column' })
  @IsInt({ message: 'targetPosition must be an integer' })
  @Min(0, { message: 'targetPosition cannot be negative' })
  targetPosition: number;
}
