import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Matches, Min } from 'class-validator';
import { ISO_DATE_PATTERN } from './date-range.dto';

export class ApplyMealPlanTemplateDto {
  @ApiProperty({ example: 9, minimum: 1 })
  @IsInt()
  @Min(1)
  planId!: number;

  @ApiProperty({ example: '2026-09-07', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  from!: string;

  @ApiProperty({ example: '2026-09-13', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  to!: string;
}
