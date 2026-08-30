import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class SaveMealPlanTemplateDto {
  @ApiPropertyOptional({ example: 'Family week', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 7, minimum: 1 })
  @IsInt()
  @Min(1)
  planId!: number;
}
