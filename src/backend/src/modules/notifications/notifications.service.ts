import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NOTIFICATIONS_REPOSITORY, type CreateNotificationRecord, type NotificationPreferenceRecord, type NotificationsRepositoryPort } from './notifications.repository';

export type NotificationCreateInput = {
  userId: number;
  kind: string;
  title: string;
  body?: string;
  actionPath?: string;
  dedupeKey: string;
  preferenceKey?: keyof NotificationPreferenceRecord | 'pantryExpiry' | 'mealReminder' | 'resumeCooking' | 'weeklyPlan' | 'householdActivity';
};

export type NotificationPreferencesInput = {
  pantryExpiry: boolean;
  mealReminder: boolean;
  resumeCooking: boolean;
  weeklyPlan: boolean;
  householdActivity: boolean;
};

const ALWAYS_CREATE_KINDS = new Set(['household-invite', 'household-activity']);
const preferenceColumns: Record<NonNullable<NotificationCreateInput['preferenceKey']>, keyof NotificationPreferenceRecord> = {
  pantry_expiry: 'pantry_expiry', pantryExpiry: 'pantry_expiry',
  meal_reminder: 'meal_reminder', mealReminder: 'meal_reminder',
  resume_cooking: 'resume_cooking', resumeCooking: 'resume_cooking',
  weekly_plan: 'weekly_plan', weeklyPlan: 'weekly_plan',
  household_activity: 'household_activity', householdActivity: 'household_activity',
};

@Injectable()
export class NotificationsService {
  constructor(@Inject(NOTIFICATIONS_REPOSITORY) private readonly repository: NotificationsRepositoryPort) {}

  async list(userId: number) {
    return { notifications: await this.repository.listForUser(userId) };
  }

  async markRead(userId: number, notificationId: number) {
    if (!(await this.repository.markRead(userId, notificationId))) throw new NotFoundException({ code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' });
    return { message: 'Notification marked as read' };
  }

  async markAllRead(userId: number) {
    return { updated: await this.repository.markAllRead(userId) };
  }

  async getPreferences(userId: number) {
    const preferences = await this.repository.findPreferences(userId);
    return { preferences: this.toClientPreferences(preferences) };
  }

  async replacePreferences(userId: number, preferences: Partial<NotificationPreferencesInput>) {
    const current = await this.repository.findPreferences(userId);
    const next: NotificationPreferenceRecord = {
      pantry_expiry: preferences.pantryExpiry ?? current.pantry_expiry,
      meal_reminder: preferences.mealReminder ?? current.meal_reminder,
      resume_cooking: preferences.resumeCooking ?? current.resume_cooking,
      weekly_plan: preferences.weeklyPlan ?? current.weekly_plan,
      household_activity: preferences.householdActivity ?? current.household_activity,
    };
    if (Object.values(next).some((value) => typeof value !== 'boolean')) throw new BadRequestException({ code: 'NOTIFICATION_PREFERENCES_INVALID', message: 'Notification preferences must be boolean values' });
    return { preferences: this.toClientPreferences(await this.repository.replacePreferences(userId, next)) };
  }

  async create(input: NotificationCreateInput) {
    if (!input.userId || !input.dedupeKey.trim() || !input.title.trim()) throw new BadRequestException({ code: 'NOTIFICATION_INVALID', message: 'Notification title and dedupe key are required' });
    if (input.preferenceKey && !ALWAYS_CREATE_KINDS.has(input.kind)) {
      const preferences = await this.repository.findPreferences(input.userId);
      if (!preferences[preferenceColumns[input.preferenceKey]]) return { notification: null, created: false };
    }
    const notification: CreateNotificationRecord = {
      user_id: input.userId,
      kind: input.kind,
      title: input.title.trim(),
      body: input.body?.trim() || null,
      action_path: input.actionPath?.trim() || null,
      dedupe_key: input.dedupeKey.trim(),
    };
    const saved = await this.repository.createIfAbsent(notification);
    return { notification: saved, created: Boolean(saved) };
  }

  private toClientPreferences(preferences: NotificationPreferenceRecord): NotificationPreferencesInput {
    return {
      pantryExpiry: preferences.pantry_expiry,
      mealReminder: preferences.meal_reminder,
      resumeCooking: preferences.resume_cooking,
      weeklyPlan: preferences.weekly_plan,
      householdActivity: preferences.household_activity,
    };
  }
}

export type NotificationsServicePort = Pick<NotificationsService, 'list' | 'markRead' | 'markAllRead' | 'getPreferences' | 'replacePreferences'>;
