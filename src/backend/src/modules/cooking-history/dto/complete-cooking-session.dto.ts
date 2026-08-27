import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const COOKING_COMPLETION_ACTIONS = ['complete', 'shopping'] as const;
export type CookingCompletionAction = (typeof COOKING_COMPLETION_ACTIONS)[number];

export class CompleteCookingSessionDto {
  @ApiPropertyOptional({ enum: COOKING_COMPLETION_ACTIONS, description: 'Resolve an insufficient pantry prompt' })
  @IsOptional()
  @IsIn(COOKING_COMPLETION_ACTIONS)
  action?: CookingCompletionAction;
}
