import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CookingHistoryController } from './cooking-history.controller';
import { CookingHistoryRepository, COOKING_HISTORY_REPOSITORY } from './cooking-history.repository';
import { CookingHistoryService } from './cooking-history.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CookingHistoryController],
  providers: [CookingHistoryRepository, { provide: COOKING_HISTORY_REPOSITORY, useExisting: CookingHistoryRepository }, CookingHistoryService],
})
export class CookingHistoryModule {}
