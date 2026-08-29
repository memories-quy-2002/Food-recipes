import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecipesModule } from '../recipes/recipes.module';
import { RecipeImportsController } from './recipe-imports.controller';
import { RecipeFetcherService } from './recipe-fetcher.service';
import { RecipeImportsService } from './recipe-imports.service';

@Module({
  imports: [AuthModule, RecipesModule],
  controllers: [RecipeImportsController],
  providers: [RecipeFetcherService, RecipeImportsService],
  exports: [RecipeImportsService],
})
export class RecipeImportsModule {}
