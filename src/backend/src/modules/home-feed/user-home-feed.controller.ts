import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { HomeFeedResponseDto } from './dto/home-feed-response.dto';
import { HomeFeedService, HomeFeedServicePort } from './home-feed.service';

@ApiTags('Home feed')
@ApiInternalServerErrorResponse()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/home-feed', version: '1' })
export class UserHomeFeedController {
  constructor(@Inject(HomeFeedService) private readonly service: HomeFeedServicePort) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized home feed recommendations' })
  @ApiOkResponse({ type: HomeFeedResponseDto })
  getPersonalizedFeed(@CurrentUser() user: AuthUser) {
    return this.service.getPersonalizedFeed(user.id);
  }
}
