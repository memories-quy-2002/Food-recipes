import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type NotificationRecord = {
  notification_id: number;
  user_id: number;
  kind: string;
  title: string;
  body: string | null;
  action_path: string | null;
  dedupe_key: string;
  read_at: Date | null;
  created_at: Date;
};

export type NotificationPreferenceRecord = {
  pantry_expiry: boolean;
  meal_reminder: boolean;
  resume_cooking: boolean;
  weekly_plan: boolean;
  household_activity: boolean;
};

export type NotificationGenerationContext = {
  expiringPantry: Array<{ pantry_id: number; name: string; expires_at: string; expiry_status: 'use_soon' | 'expired' }>;
  nextMeals: Array<{ plan_item_id: number; recipe_name: string; planned_date: string }>;
  pausedSessions: Array<{ session_id: number; recipe_name: string; last_active_at: string }>;
  endingPlans: Array<{ plan_id: number; end_date: string }>;
  householdInvites: Array<{ invite_id: number; household_name: string }>;
};

export type CreateNotificationRecord = Omit<NotificationRecord, 'notification_id' | 'read_at' | 'created_at'>;

export interface NotificationsRepositoryPort {
  listForUser(userId: number): Promise<NotificationRecord[]>;
  markRead(userId: number, notificationId: number): Promise<boolean>;
  markAllRead(userId: number): Promise<number>;
  findPreferences(userId: number): Promise<NotificationPreferenceRecord>;
  replacePreferences(userId: number, preferences: NotificationPreferenceRecord): Promise<NotificationPreferenceRecord>;
  createIfAbsent(notification: CreateNotificationRecord): Promise<NotificationRecord | null>;
  findGenerationContext(userId: number, today: string): Promise<NotificationGenerationContext>;
}

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

@Injectable()
export class NotificationsRepository implements NotificationsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: number): Promise<NotificationRecord[]> {
    return this.prisma.$queryRaw<NotificationRecord[]>(Prisma.sql`
      SELECT notification_id, user_id, kind, title, body, action_path, dedupe_key, read_at, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC, notification_id DESC
      LIMIT 100
    `);
  }

  markRead(userId: number, notificationId: number): Promise<boolean> {
    return this.prisma.$executeRaw(Prisma.sql`
      UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE notification_id = ${notificationId} AND user_id = ${userId}
    `).then((count) => count > 0);
  }

  markAllRead(userId: number): Promise<number> {
    return this.prisma.$executeRaw(Prisma.sql`
      UPDATE notifications SET read_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND read_at IS NULL
    `);
  }

  async findPreferences(userId: number): Promise<NotificationPreferenceRecord> {
    const preference = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    return {
      pantry_expiry: preference?.pantryExpiry ?? true,
      meal_reminder: preference?.mealReminder ?? true,
      resume_cooking: preference?.resumeCooking ?? true,
      weekly_plan: preference?.weeklyPlan ?? true,
      household_activity: preference?.householdActivity ?? true,
    };
  }

  async replacePreferences(userId: number, preferences: NotificationPreferenceRecord): Promise<NotificationPreferenceRecord> {
    const saved = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, pantryExpiry: preferences.pantry_expiry, mealReminder: preferences.meal_reminder, resumeCooking: preferences.resume_cooking, weeklyPlan: preferences.weekly_plan, householdActivity: preferences.household_activity },
      update: { pantryExpiry: preferences.pantry_expiry, mealReminder: preferences.meal_reminder, resumeCooking: preferences.resume_cooking, weeklyPlan: preferences.weekly_plan, householdActivity: preferences.household_activity, updatedAt: new Date() },
    });
    return {
      pantry_expiry: saved.pantryExpiry,
      meal_reminder: saved.mealReminder,
      resume_cooking: saved.resumeCooking,
      weekly_plan: saved.weeklyPlan,
      household_activity: saved.householdActivity,
    };
  }

  async createIfAbsent(notification: CreateNotificationRecord): Promise<NotificationRecord | null> {
    const rows = await this.prisma.$queryRaw<NotificationRecord[]>(Prisma.sql`
      INSERT INTO notifications (user_id, kind, title, body, action_path, dedupe_key)
      VALUES (${notification.user_id}, ${notification.kind}, ${notification.title}, ${notification.body}, ${notification.action_path}, ${notification.dedupe_key})
      ON CONFLICT (user_id, dedupe_key) DO NOTHING
      RETURNING notification_id, user_id, kind, title, body, action_path, dedupe_key, read_at, created_at
    `);
    return rows[0] ?? null;
  }

  async findGenerationContext(userId: number, today: string): Promise<NotificationGenerationContext> {
    const [expiringPantry, nextMeals, pausedSessions, endingPlans, householdInvites] = await Promise.all([
      this.prisma.$queryRaw<NotificationGenerationContext['expiringPantry']>(Prisma.sql`
        SELECT pantry_id, name, expires_at::text,
          CASE WHEN expires_at < ${today}::date THEN 'expired' ELSE 'use_soon' END AS expiry_status
        FROM pantry_items
        WHERE (user_id = ${userId} OR household_id IN (SELECT household_id FROM household_members WHERE user_id = ${userId}))
          AND expires_at <= (${today}::date + INTERVAL '3 days')
      `),
      this.prisma.$queryRaw<NotificationGenerationContext['nextMeals']>(Prisma.sql`
        SELECT mpi.item_id AS plan_item_id, r.recipe_name, mpi.planned_date::text
        FROM meal_plan_items mpi
        JOIN meal_plans mp ON mp.plan_id = mpi.plan_id
        JOIN recipes r ON r.recipe_id = mpi.recipe_id
        WHERE mpi.planned_date = ${today}::date
          AND (mp.user_id = ${userId} OR mp.household_id IN (SELECT household_id FROM household_members WHERE user_id = ${userId}))
      `),
      this.prisma.$queryRaw<NotificationGenerationContext['pausedSessions']>(Prisma.sql`
        SELECT cs.session_id, r.recipe_name, cs.last_active_at::text
        FROM cooking_sessions cs JOIN recipes r ON r.recipe_id = cs.recipe_id
        WHERE cs.user_id = ${userId} AND cs.status = 'paused' AND cs.last_active_at < CURRENT_TIMESTAMP - INTERVAL '1 day'
      `),
      this.prisma.$queryRaw<NotificationGenerationContext['endingPlans']>(Prisma.sql`
        SELECT plan_id, end_date::text FROM meal_plans
        WHERE user_id = ${userId} AND end_date BETWEEN ${today}::date AND (${today}::date + INTERVAL '2 days')
      `),
      this.prisma.$queryRaw<NotificationGenerationContext['householdInvites']>(Prisma.sql`
        SELECT hi.invite_id, h.name AS household_name
        FROM household_invites hi JOIN households h ON h.household_id = hi.household_id JOIN accounts a ON a.email = hi.email
        WHERE a.user_id = ${userId} AND hi.accepted_at IS NULL AND hi.expires_at > CURRENT_TIMESTAMP
      `),
    ]);
    return { expiringPantry, nextMeals, pausedSessions, endingPlans, householdInvites };
  }
}
