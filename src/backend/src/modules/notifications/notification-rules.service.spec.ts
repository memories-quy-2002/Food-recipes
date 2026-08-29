import type { NotificationsRepositoryPort } from './notifications.repository';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationsService } from './notifications.service';

describe('NotificationRulesService', () => {
  const repository: jest.Mocked<NotificationsRepositoryPort> = {
    listForUser: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn(), findPreferences: jest.fn(), replacePreferences: jest.fn(), createIfAbsent: jest.fn(), findGenerationContext: jest.fn(),
  };

  it('creates actionable notifications for current kitchen context', async () => {
    repository.findPreferences.mockResolvedValue({ pantry_expiry: true, meal_reminder: true, resume_cooking: true, weekly_plan: true, household_activity: true });
    repository.findGenerationContext.mockResolvedValue({
      expiringPantry: [{ pantry_id: 4, name: 'Spinach', expires_at: '2026-08-29', expiry_status: 'use_soon' }],
      nextMeals: [{ plan_item_id: 12, recipe_name: 'Pasta', planned_date: '2026-08-28' }],
      pausedSessions: [{ session_id: 21, recipe_name: 'Soup', last_active_at: '2026-08-27' }],
      endingPlans: [{ plan_id: 8, end_date: '2026-08-29' }],
      householdInvites: [{ invite_id: 9, household_name: 'Smith Household' }],
    });
    repository.createIfAbsent.mockResolvedValue({} as never);
    const service = new NotificationRulesService(new NotificationsService(repository), repository);

    await expect(service.generateForUser(7, new Date('2026-08-28T08:00:00Z'))).resolves.toMatchObject({ created: 5 });
    expect(repository.createIfAbsent).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7, kind: 'pantry-expiry' }));
  });
});
