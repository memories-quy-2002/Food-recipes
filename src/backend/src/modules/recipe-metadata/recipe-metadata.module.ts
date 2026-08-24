import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RecipeMetadataController } from './recipe-metadata.controller';
import { RecipeMetadataRepository, RECIPE_METADATA_REPOSITORY } from './recipe-metadata.repository';
import { RecipeMetadataService } from './recipe-metadata.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RecipeMetadataController],
  providers: [
    RecipeMetadataRepository,
    { provide: RECIPE_METADATA_REPOSITORY, useExisting: RecipeMetadataRepository },
    RecipeMetadataService,
  ],
  exports: [RecipeMetadataService],
})
export class RecipeMetadataModule {}
