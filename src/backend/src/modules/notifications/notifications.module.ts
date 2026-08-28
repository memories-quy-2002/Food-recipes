import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository, NOTIFICATIONS_REPOSITORY } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [NotificationsRepository, { provide: NOTIFICATIONS_REPOSITORY, useExisting: NotificationsRepository }, NotificationsService, NotificationRulesService],
  exports: [NotificationsService, NotificationRulesService],
})
export class NotificationsModule {}
