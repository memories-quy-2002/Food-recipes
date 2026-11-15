import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Min } from 'class-validator';

export class WeeklyShoppingPlanDto {
  @ApiProperty({ minimum: 1, example: 42 })
  @IsInt()
  @Min(1)
  planId!: number;
}

export class ConfirmWeeklyShoppingDto extends WeeklyShoppingPlanDto {
  @ApiProperty({ description: 'SHA-256 snapshot from the read-only weekly preview.' })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  snapshot!: string;
}
