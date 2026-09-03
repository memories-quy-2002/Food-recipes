import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PlanningModule } from './modules/planning/planning.module';
import { MediaModule } from './modules/media/media.module';
import { NotesModule } from './modules/notes/notes.module';
import { PantryModule } from './modules/pantry/pantry.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { HomeFeedModule } from './modules/home-feed/home-feed.module';
import { CookingHistoryModule } from './modules/cooking-history/cooking-history.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { HouseholdsModule } from './modules/households/households.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RecipeImportsModule } from './modules/recipe-imports/recipe-imports.module';
import { JournalsModule } from './modules/journals/journals.module';
import { LeftoversModule } from './modules/leftovers/leftovers.module';
import { PRODUCT_ANALYTICS } from './common/analytics/product-analytics.port';
import { ProductAnalyticsService } from './common/analytics/product-analytics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, authConfig, databaseConfig],
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    RecipesModule,
    TaxonomyModule,
    RatingsModule,
    WishlistModule,
    CollectionsModule,
    ReportsModule,
    PlanningModule,
    MediaModule,
    NotesModule,
    PantryModule,
    SuggestionsModule,
    HomeFeedModule,
    CookingHistoryModule,
    PreferencesModule,
    RecommendationsModule,
    HouseholdsModule,
    NotificationsModule,
    RecipeImportsModule,
    JournalsModule,
    LeftoversModule,
  ],
  providers: [ProductAnalyticsService, { provide: PRODUCT_ANALYTICS, useExisting: ProductAnalyticsService }],
})
export class AppModule {}
