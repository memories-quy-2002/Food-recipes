import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { JournalsController } from './journals.controller';
import { JournalsRepository, JOURNALS_REPOSITORY } from './journals.repository';
import { JournalsService } from './journals.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [JournalsController],
  providers: [JournalsRepository, { provide: JOURNALS_REPOSITORY, useExisting: JournalsRepository }, JournalsService],
  exports: [JournalsService],
})
export class JournalsModule {}
