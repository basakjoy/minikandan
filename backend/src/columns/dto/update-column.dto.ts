import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateColumnDto {
  @ApiPropertyOptional({ example: 'QA & Testing' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  order?: number;
}
