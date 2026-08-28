import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { HouseholdAccessService } from './household-access.service';
import { HouseholdRoleGuard } from './household-role.guard';
import { HOUSEHOLDS_REPOSITORY, HouseholdsRepository } from './households.repository';
import { HouseholdsService } from './households.service';

@Module({
  imports: [PrismaModule],
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
