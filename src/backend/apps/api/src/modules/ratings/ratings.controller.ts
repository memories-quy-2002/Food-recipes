import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { UpsertRatingDto } from './dto/upsert-rating.dto';
import { RatingsService, RatingsServicePort } from './ratings.service';

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
  remove(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ratingsService.remove(user.id, recipeId);
  }

  @Get(':recipeId/reviews')
  @ApiOperation({ summary: 'List recipe reviews and aggregate rating' })
  listReviews(@Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.ratingsService.listReviews(recipeId);
  }
}
