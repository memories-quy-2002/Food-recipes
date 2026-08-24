import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PantryController } from './pantry.controller';
import { PantryRepository, PANTRY_REPOSITORY } from './pantry.repository';
import { PantryService } from './pantry.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PantryController],
  providers: [PantryRepository, { provide: PANTRY_REPOSITORY, useExisting: PantryRepository }, PantryService],
  exports: [PantryService],
})
export class PantryModule {}
