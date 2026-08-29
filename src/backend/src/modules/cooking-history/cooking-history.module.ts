import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CookingHistoryController } from './cooking-history.controller';
import { CookingHistoryRepository, COOKING_HISTORY_REPOSITORY } from './cooking-history.repository';
import { CookingHistoryService } from './cooking-history.service';
import { CookingSessionController } from './cooking-session.controller';
import { CookingSessionRepository, COOKING_SESSION_REPOSITORY } from './cooking-session.repository';
import { CookingSessionService } from './cooking-session.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CookingHistoryController, CookingSessionController],
  providers: [
    CookingHistoryRepository,
    { provide: COOKING_HISTORY_REPOSITORY, useExisting: CookingHistoryRepository },
    CookingHistoryService,
    CookingSessionRepository,
    { provide: COOKING_SESSION_REPOSITORY, useExisting: CookingSessionRepository },
    CookingSessionService,
  ],
  exports: [CookingHistoryService],
})
export class CookingHistoryModule {}
