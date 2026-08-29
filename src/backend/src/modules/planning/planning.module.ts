import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdsModule } from '../households/households.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { HouseholdPlanningController, PlanningController } from './planning.controller';
import { PlanningRepository, PLANNING_REPOSITORY } from './planning.repository';
import { PlanningService } from './planning.service';
import { MealPlanGeneratorService } from './meal-plan-generator.service';

@Module({
  imports: [AuthModule, PrismaModule, RecommendationsModule, HouseholdsModule],
  controllers: [PlanningController, HouseholdPlanningController],
  providers: [PlanningRepository, { provide: PLANNING_REPOSITORY, useExisting: PlanningRepository }, PlanningService, MealPlanGeneratorService],
  exports: [PlanningService],
})
export class PlanningModule {}
