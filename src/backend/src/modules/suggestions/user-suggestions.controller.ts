import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { SuggestionsService, SuggestionsServicePort } from './suggestions.service';

@ApiTags('Suggestions')
@ApiInternalServerErrorResponse()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/suggestions', version: '1' })
export class UserSuggestionsController {
  constructor(@Inject(SuggestionsService) private readonly service: SuggestionsServicePort) {}

  @Post()
  @ApiOperation({ summary: 'Get personalized or meal-plan suggestions' })
  @ApiOkResponse({ description: 'Personalized catalog-backed suggestions' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSuggestionDto) {
    return this.service.suggest(dto, user.id);
  }
}
