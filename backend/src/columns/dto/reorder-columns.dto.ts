import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class ColumnOrderItemDto {
  @ApiProperty({ example: 'column-uuid-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  order: number;
}

export class ReorderColumnsDto {
  @ApiProperty({ type: [ColumnOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnOrderItemDto)
  columns: ColumnOrderItemDto[];
}
