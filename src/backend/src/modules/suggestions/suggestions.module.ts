import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SuggestionsController } from './suggestions.controller';
import { UserSuggestionsController } from './user-suggestions.controller';
import { SuggestionsRepository, SUGGESTIONS_REPOSITORY } from './suggestions.repository';
import { SuggestionsService } from './suggestions.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SuggestionsController, UserSuggestionsController],
  providers: [
    SuggestionsRepository,
    { provide: SUGGESTIONS_REPOSITORY, useExisting: SuggestionsRepository },
    SuggestionsService,
  ],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
