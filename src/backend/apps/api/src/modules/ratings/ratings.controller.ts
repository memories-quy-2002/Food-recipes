import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { UpsertRatingDto } from './dto/upsert-rating.dto';
import { RatingsService, RatingsServicePort } from './ratings.service';
import {
  ApiErrorResponseDto,
  RatingMutationResponseDto,
  RatingRemovalResponseDto,
  ReviewsResponseDto,
} from '../../common/swagger/response.schemas';

@ApiTags('Ratings')
@Controller({ path: 'recipes', version: '1' })
export class RatingsController {
  constructor(
    @Inject(RatingsService)
    private readonly ratingsService: RatingsServicePort,
  ) {}

  @Put(':recipeId/rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update the authenticated user rating' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe identifier' })
  @ApiOkResponse({ description: 'Rating saved', type: RatingMutationResponseDto })
  @ApiBadRequestResponse({ description: 'Rating input or recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Recipe authors cannot review their own recipes', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Recipe was not found', type: ApiErrorResponseDto })
  upsert(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertRatingDto,
  ) {
    return this.ratingsService.upsert(user.id, recipeId, dto);
  }

  @Delete(':recipeId/rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete the authenticated user rating' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe identifier' })
  @ApiOkResponse({ description: 'Rating removed', type: RatingRemovalResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rating was not found', type: ApiErrorResponseDto })
  remove(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ratingsService.remove(user.id, recipeId);
  }

  @Get(':recipeId/reviews')
  @ApiOperation({ summary: 'List recipe reviews and aggregate rating' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe identifier' })
  @ApiBadRequestResponse({ description: 'Recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiOkResponse({ description: 'Reviews and aggregate rating', type: ReviewsResponseDto })
  listReviews(@Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.ratingsService.listReviews(recipeId);
  }
}
