import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const COOKING_SESSION_EDITABLE_STATUSES = ['active', 'paused'] as const;
export type CookingSessionEditableStatus = (typeof COOKING_SESSION_EDITABLE_STATUSES)[number];

export class UpdateCookingSessionDto {
  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  currentStep?: number;

  @ApiPropertyOptional({ enum: COOKING_SESSION_EDITABLE_STATUSES })
  @IsOptional()
  @IsIn(COOKING_SESSION_EDITABLE_STATUSES)
  status?: CookingSessionEditableStatus;
}
