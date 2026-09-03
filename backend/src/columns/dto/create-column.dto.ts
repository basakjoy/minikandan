import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({ example: 'Code Review' })
  @IsString()
  @IsNotEmpty({ message: 'Column title is required' })
  title: string;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  order?: number;
}
