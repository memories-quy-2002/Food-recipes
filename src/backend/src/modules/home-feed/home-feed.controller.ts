import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { HomeFeedResponseDto } from './dto/home-feed-response.dto';
import { HomeFeedService, HomeFeedServicePort } from './home-feed.service';

@ApiTags('Home feed')
@ApiInternalServerErrorResponse()
@Controller({ path: 'home-feed', version: '1' })
export class HomeFeedController {
  constructor(@Inject(HomeFeedService) private readonly service: HomeFeedServicePort) {}

  @Get()
  @ApiOperation({ summary: 'Get public home feed recommendations' })
  @ApiOkResponse({ type: HomeFeedResponseDto })
  getPublicFeed() {
    return this.service.getPublicFeed();
  }
}
