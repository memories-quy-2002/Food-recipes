import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { RatingsService, RatingsServicePort } from './ratings.service';

@ApiTags('Ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/ratings', version: '1' })
export class UserRatingsController {
  constructor(
    @Inject(RatingsService)
    private readonly ratingsService: RatingsServicePort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List ratings belonging to the authenticated user' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.ratingsService.listMine(user.id);
  }
}
