import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import {
  CategoriesResponseDto,
  MealsResponseDto,
} from '../../common/swagger/response.schemas';
import { TaxonomyService, TaxonomyServicePort } from './taxonomy.service';

@ApiTags('Taxonomy')
@ApiInternalServerErrorResponse()
@Controller({ version: '1' })
export class TaxonomyController {
  constructor(
    @Inject(TaxonomyService)
    private readonly taxonomyService: TaxonomyServicePort,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'List recipe categories' })
  @ApiOkResponse({ description: 'Categories linked to recipes', type: CategoriesResponseDto })
  listCategories() {
    return this.taxonomyService.listCategories();
  }

  @Get('meals')
  @ApiOperation({ summary: 'List meal types' })
  @ApiOkResponse({ description: 'Meals linked to recipes', type: MealsResponseDto })
  listMeals() {
    return this.taxonomyService.listMeals();
  }
}
