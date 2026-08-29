import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdAccessService } from './household-access.service';
import { HouseholdsController } from './households.controller';
import { HouseholdRoleGuard } from './household-role.guard';
import { HOUSEHOLDS_REPOSITORY, HouseholdsRepository } from './households.repository';
import { HouseholdsService } from './households.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HouseholdsController],
  providers: [
    HouseholdsRepository,
    { provide: HOUSEHOLDS_REPOSITORY, useExisting: HouseholdsRepository },
    HouseholdAccessService,
    HouseholdRoleGuard,
    HouseholdsService,
  ],
  exports: [HouseholdAccessService, HouseholdRoleGuard, HouseholdsService, HOUSEHOLDS_REPOSITORY],
})
export class HouseholdsModule {}
