import { Inject, Injectable } from '@nestjs/common';
import { NotificationsService, type NotificationCreateInput } from './notifications.service';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepositoryPort } from './notifications.repository';
import { workflowTelemetry } from '../../common/telemetry/workflow-telemetry.service';

@Injectable()
export class NotificationRulesService {
  constructor(
    private readonly notifications: NotificationsService,
    @Inject(NOTIFICATIONS_REPOSITORY) private readonly repository: NotificationsRepositoryPort,
  ) {}

  createForUser(input: NotificationCreateInput) {
    return this.notifications.create(input);
  }

  pantryExpiry(userId: number, pantryId: number, date: string, itemName: string, expiryStatus: 'use_soon' | 'expired') {
    return this.createForUser({ userId, kind: 'pantry-expiry', title: expiryStatus === 'expired' ? `${itemName} has expired` : `${itemName} expires soon`, body: expiryStatus === 'expired' ? 'Check this item before using it.' : `Use it before ${date}.`, actionPath: '/pantry', dedupeKey: `pantry-expiry:${pantryId}:${date}`, preferenceKey: 'pantry_expiry' });
  }

  mealReminder(userId: number, planItemId: number, date: string, recipeName: string) {
    return this.createForUser({ userId, kind: 'meal-reminder', title: `Cook ${recipeName} today`, body: 'Your planned meal is ready when you are.', actionPath: '/planning', dedupeKey: `meal-reminder:${planItemId}:${date}`, preferenceKey: 'meal_reminder' });
  }

  resumeCooking(userId: number, sessionId: number, date: string, recipeName: string) {
    return this.createForUser({ userId, kind: 'resume-cooking', title: `Continue ${recipeName}`, body: 'Pick up where you left off.', actionPath: `/recipe/cooking?sessionId=${sessionId}`, dedupeKey: `resume-cooking:${sessionId}:${date}`, preferenceKey: 'resume_cooking' });
  }

  async generateForUser(userId: number, now = new Date()) {
    return workflowTelemetry.run('notification.generate', { surface: 'notifications' }, async () => {
      const today = now.toISOString().slice(0, 10);
      const context = await this.repository.findGenerationContext(userId, today);
      const results = await Promise.all([
        ...context.expiringPantry.map((item) => this.pantryExpiry(userId, item.pantry_id, item.expires_at, item.name, item.expiry_status)),
        ...context.nextMeals.map((item) => this.mealReminder(userId, item.plan_item_id, item.planned_date, item.recipe_name)),
        ...context.pausedSessions.map((item) => this.resumeCooking(userId, item.session_id, today, item.recipe_name)),
        ...context.endingPlans.map((item) => this.createForUser({ userId, kind: 'weekly-plan-ending', title: 'Your weekly plan is nearly done', body: `Your plan ends on ${item.end_date}.`, actionPath: '/planning', dedupeKey: `weekly-plan-ending:${item.plan_id}:${item.end_date}`, preferenceKey: 'weekly_plan' })),
        ...context.householdInvites.map((item) => this.createForUser({ userId, kind: 'household-invite', title: `Invite to ${item.household_name}`, body: 'You have a household invite waiting.', actionPath: '/households', dedupeKey: `household-invite:${item.invite_id}`, preferenceKey: 'household_activity' })),
      ]);
      return { created: results.filter((result) => result.created).length };
    });
  }
}
