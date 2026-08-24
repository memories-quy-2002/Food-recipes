import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { SuggestionsService, SuggestionsServicePort } from './suggestions.service';

@ApiTags('Suggestions')
@ApiInternalServerErrorResponse()
@Controller({ path: 'suggestions', version: '1' })
export class SuggestionsController {
  constructor(@Inject(SuggestionsService) private readonly service: SuggestionsServicePort) {}

  @Post()
  @ApiOperation({ summary: 'Get read-only ingredient or substitution suggestions' })
  @ApiOkResponse({ description: 'Catalog-backed suggestions' })
  create(@Body() dto: CreateSuggestionDto) {
    return this.service.suggest(dto);
  }
}
