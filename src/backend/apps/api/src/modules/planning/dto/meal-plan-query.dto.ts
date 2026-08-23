import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';
import { ISO_DATE_PATTERN } from './date-range.dto';

export class MealPlanQueryDto {
  @ApiPropertyOptional({ example: '2026-08-24', pattern: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-30', pattern: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  to?: string;
}
