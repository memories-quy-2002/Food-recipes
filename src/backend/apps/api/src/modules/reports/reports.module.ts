import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AdminReportsController, ReportsController } from './reports.controller';
import { ReportsRepository, REPORTS_REPOSITORY } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsRepository, { provide: REPORTS_REPOSITORY, useExisting: ReportsRepository }, ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
