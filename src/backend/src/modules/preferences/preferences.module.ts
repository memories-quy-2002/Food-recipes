import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PreferencesController } from './preferences.controller';
import { PreferencesRepository, PREFERENCES_REPOSITORY } from './preferences.repository';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PreferencesController],
  providers: [
    PreferencesRepository,
    { provide: PREFERENCES_REPOSITORY, useExisting: PreferencesRepository },
    PreferencesService,
  ],
  exports: [PreferencesService],
})
export class PreferencesModule {}
