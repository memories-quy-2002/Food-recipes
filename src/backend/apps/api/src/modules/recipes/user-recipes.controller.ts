import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { RecipesService } from './recipes.service';
import { ApiErrorResponseDto, RecipeListResponseDto } from '../../common/swagger/response.schemas';

@ApiTags('Recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/recipes', version: '1' })
export class UserRecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'List recipes created by the authenticated user' })
  @ApiOkResponse({ description: 'Recipes owned by the authenticated user', type: RecipeListResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  listMine(@CurrentUser() user: AuthUser) {
    return this.recipesService.listMine(user.id);
  }
}
