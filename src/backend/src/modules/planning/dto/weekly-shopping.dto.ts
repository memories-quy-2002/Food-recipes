import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString, Matches, Min } from 'class-validator';
import { ISO_DATE_PATTERN } from './date-range.dto';

export class WeeklyShoppingPlanDto {
  @ApiProperty({ minimum: 1, example: 42 })
  @IsInt()
  @Min(1)
  planId!: number;

  @ApiProperty({ example: '2026-11-16', description: 'First day of the selected week.' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  from!: string;

  @ApiProperty({ example: '2026-11-22', description: 'Last day of the selected week.' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  to!: string;
}

export class ConfirmWeeklyShoppingDto extends WeeklyShoppingPlanDto {
  @ApiProperty({ description: 'SHA-256 snapshot from the read-only weekly preview.' })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  snapshot!: string;
}
