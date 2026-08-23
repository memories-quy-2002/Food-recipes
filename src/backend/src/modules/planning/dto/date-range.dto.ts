import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class DateRangeDto {
  @ApiProperty({ example: 'Weekly family meals', maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: '2026-08-24', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  from!: string;

  @ApiProperty({ example: '2026-08-30', pattern: 'YYYY-MM-DD' })
  @IsDateString()
  @Matches(ISO_DATE_PATTERN)
  to!: string;
}
