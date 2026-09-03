import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'Product Launch Roadmap' })
  @IsString()
  @IsNotEmpty({ message: 'Board title is required' })
  title: string;

  @ApiPropertyOptional({ example: 'Tasks and deliverables for Q3 product release' })
  @IsString()
  @IsOptional()
  description?: string;
}
