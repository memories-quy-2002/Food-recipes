import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { HomeFeedController } from './home-feed.controller';
import { HomeFeedRepository, HOME_FEED_REPOSITORY } from './home-feed.repository';
import { HomeFeedService } from './home-feed.service';
import { UserHomeFeedController } from './user-home-feed.controller';

@Module({
  imports: [AuthModule, PrismaModule, RecommendationsModule],
  controllers: [HomeFeedController, UserHomeFeedController],
  providers: [
    HomeFeedRepository,
    { provide: HOME_FEED_REPOSITORY, useExisting: HomeFeedRepository },
    HomeFeedService,
  ],
  exports: [HomeFeedService],
})
export class HomeFeedModule {}
