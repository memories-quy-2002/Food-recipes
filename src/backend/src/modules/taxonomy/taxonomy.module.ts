import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyRepository } from './taxonomy.repository';
import { TaxonomyService } from './taxonomy.service';

@Module({
  imports: [PrismaModule],
  controllers: [TaxonomyController],
  providers: [TaxonomyRepository, TaxonomyService],
})
export class TaxonomyModule {}
