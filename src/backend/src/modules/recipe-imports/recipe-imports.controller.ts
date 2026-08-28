import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PreviewRecipeImportDto, SaveRecipeImportDto } from './dto/recipe-import.dto';
import { RecipeImportsService } from './recipe-imports.service';

@ApiTags('Recipe imports')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/recipe-imports', version: '1' })
export class RecipeImportsController {
  constructor(private readonly imports: RecipeImportsService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview a recipe from a public URL' })
  @ApiOkResponse()
  preview(@Body() dto: PreviewRecipeImportDto) { return this.imports.preview(dto.url); }

  @Post('drafts')
  @ApiOperation({ summary: 'Save an imported recipe as an owned draft' })
  @ApiOkResponse()
  saveDraft(@CurrentUser() user: AuthUser, @Body() dto: SaveRecipeImportDto) { return this.imports.saveDraft(user.id, dto); }
}
