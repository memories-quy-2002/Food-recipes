import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecipesController } from './recipes.controller';
import { RecipesRepository } from './recipes.repository';
import { RecipesService } from './recipes.service';
import { UserRecipesController } from './user-recipes.controller';
import { RecipeMetadataModule } from '../recipe-metadata/recipe-metadata.module';

@Module({
  imports: [AuthModule, RecipeMetadataModule],
  controllers: [RecipesController, UserRecipesController],
  providers: [RecipesRepository, RecipesService],
  exports: [RecipesRepository, RecipesService],
})
export class RecipesModule {}
