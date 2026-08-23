import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PlanningController } from './planning.controller';
import { PlanningRepository, PLANNING_REPOSITORY } from './planning.repository';
import { PlanningService } from './planning.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PlanningController],
  providers: [PlanningRepository, { provide: PLANNING_REPOSITORY, useExisting: PlanningRepository }, PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
