import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateLeftoverDto {
  @ApiProperty({ example: 42 }) @IsInt() @Min(1) cookingHistoryId!: number;
  @ApiProperty({ example: 2, minimum: 1 }) @IsInt() @Min(1) servings!: number;
  @ApiProperty({ example: '2026-09-02T10:00:00.000Z' }) @IsDateString() expiresAt!: string;
}
