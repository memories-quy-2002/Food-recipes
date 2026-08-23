import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RatingsController } from './ratings.controller';
import { RatingsRepository, RATINGS_REPOSITORY } from './ratings.repository';
import { RatingsService } from './ratings.service';
import { UserRatingsController } from './user-ratings.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RatingsController, UserRatingsController],
  providers: [
    RatingsRepository,
    { provide: RATINGS_REPOSITORY, useExisting: RatingsRepository },
    RatingsService,
  ],
  exports: [RatingsRepository, RatingsService],
})
export class RatingsModule {}
