import { Body, Controller, Get, Inject, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { ApiErrorResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { UpsertRecipeMetadataDto } from './dto/recipe-metadata.dto';
import { RecipeMetadataService, RecipeMetadataServicePort } from './recipe-metadata.service';

@ApiTags('Recipe metadata')
@ApiInternalServerErrorResponse()
@Controller({ path: 'recipes', version: '1' })
export class RecipeMetadataController {
  constructor(@Inject(RecipeMetadataService) private readonly service: RecipeMetadataServicePort) {}

  @Get(':recipeId/metadata')
  @ApiOperation({ summary: 'Get explicitly provided nutrition and allergen metadata' })
  @ApiOkResponse({ description: 'Recipe metadata' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  get(@Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.service.get(recipeId);
  }

  @Put(':recipeId/metadata')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace metadata on an owned recipe' })
  @ApiOkResponse({ description: 'Recipe metadata replaced' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  replace(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertRecipeMetadataDto,
  ) {
    return this.service.replace(recipeId, user.id, dto);
  }
}
