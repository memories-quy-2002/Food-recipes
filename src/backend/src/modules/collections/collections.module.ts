import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CollectionsController } from './collections.controller';
import { CollectionsRepository, COLLECTIONS_REPOSITORY } from './collections.repository';
import { CollectionsService } from './collections.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CollectionsController],
  providers: [CollectionsRepository, { provide: COLLECTIONS_REPOSITORY, useExisting: CollectionsRepository }, CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
