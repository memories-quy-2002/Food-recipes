import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HouseholdsModule } from '../households/households.module';
import { HouseholdPantryController, PantryController } from './pantry.controller';
import { PantryRepository, PANTRY_REPOSITORY } from './pantry.repository';
import { PantryService } from './pantry.service';

@Module({
  imports: [AuthModule, PrismaModule, HouseholdsModule],
  controllers: [PantryController, HouseholdPantryController],
  providers: [PantryRepository, { provide: PANTRY_REPOSITORY, useExisting: PantryRepository }, PantryService],
  exports: [PantryService],
})
export class PantryModule {}
