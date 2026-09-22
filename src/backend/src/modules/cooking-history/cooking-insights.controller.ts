import { Controller, Get, Inject, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { CookingRecapResponseDto, RecipeCookingMemoryResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CookingInsightsService, CookingInsightsServicePort } from './cooking-insights.service';

@ApiTags('Personal cooking insights')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me', version: '1' })
export class CookingInsightsController {
  constructor(@Inject(CookingInsightsService) private readonly service: CookingInsightsServicePort) {}

  @Get('cooking-history/recap')
  @ApiOperation({ summary: 'Summarize completed cooks belonging to the authenticated user' })
  @ApiOkResponse({ type: CookingRecapResponseDto })
  getRecap(@CurrentUser() user: AuthUser) {
    return this.service.getRecap(user.id);
  }

  @Get('recipes/:recipeId/cooking-memory')
  @ApiOperation({ summary: 'Get the authenticated user cooking memory for a recipe' })
  @ApiOkResponse({ type: RecipeCookingMemoryResponseDto })
  getRecipeMemory(@CurrentUser() user: AuthUser, @Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.service.getRecipeMemory(user.id, recipeId);
  }
}
