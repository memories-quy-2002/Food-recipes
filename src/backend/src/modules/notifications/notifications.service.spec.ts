import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { NotificationsRepositoryPort } from './notifications.repository';
import { NotificationsService } from './notifications.service';

const notification = (overrides: Partial<Parameters<NotificationsRepositoryPort['createIfAbsent']>[0]> = {}) => ({
  notification_id: 4,
  user_id: 7,
  kind: 'meal-reminder',
  title: 'Dinner is ready to plan',
  body: 'Your next planned meal is tonight.',
  action_path: '/planning',
  dedupe_key: 'meal-reminder:12:2026-08-28',
  read_at: null,
  created_at: new Date('2026-08-28T08:00:00Z'),
  ...overrides,
});

describe('NotificationsService', () => {
  const repository: jest.Mocked<NotificationsRepositoryPort> = {
    listForUser: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    findPreferences: jest.fn(),
    replacePreferences: jest.fn(),
    createIfAbsent: jest.fn(),
    findGenerationContext: jest.fn(),
  };
  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(repository);
  });

  it('returns only notifications owned by the authenticated user', async () => {
    repository.listForUser.mockResolvedValue([notification()]);

    await expect(service.list(7)).resolves.toEqual({ notifications: [notification()] });
    expect(repository.listForUser).toHaveBeenCalledWith(7);
  });

  it('does not create a duplicate semantic reminder', async () => {
    repository.findPreferences.mockResolvedValue({ pantry_expiry: true, meal_reminder: true, resume_cooking: true, weekly_plan: true, household_activity: true });
    repository.createIfAbsent.mockResolvedValue(null);

    await expect(service.create({
      userId: 7,
      kind: 'meal-reminder',
      title: 'Dinner is ready to plan',
      dedupeKey: 'meal-reminder:12:2026-08-28',
      preferenceKey: 'mealReminder',
    })).resolves.toEqual({ notification: null, created: false });
    expect(repository.createIfAbsent).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7 }));
  });

  it('suppresses optional notifications when the user disabled that preference', async () => {
    repository.findPreferences.mockResolvedValue({ pantry_expiry: true, meal_reminder: false, resume_cooking: true, weekly_plan: true, household_activity: true });

    await expect(service.create({
      userId: 7,
      kind: 'meal-reminder',
      title: 'Dinner is ready to plan',
      dedupeKey: 'meal-reminder:12:2026-08-28',
      preferenceKey: 'mealReminder',
    })).resolves.toEqual({ notification: null, created: false });
    expect(repository.createIfAbsent).not.toHaveBeenCalled();
  });

  it('creates household activity even when optional reminders are disabled', async () => {
    repository.findPreferences.mockResolvedValue({ pantry_expiry: true, meal_reminder: true, resume_cooking: true, weekly_plan: true, household_activity: false });
    repository.createIfAbsent.mockResolvedValue(notification({ kind: 'household-invite', dedupe_key: 'household-invite:8' }));

    await expect(service.create({
      userId: 7,
      kind: 'household-invite',
      title: 'You have a household invite',
      dedupeKey: 'household-invite:8',
      preferenceKey: 'householdActivity',
    })).resolves.toMatchObject({ created: true });
  });

  it('rejects marking another user notification as read', async () => {
    repository.markRead.mockResolvedValue(false);

    await expect(service.markRead(7, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid preference values before persistence', async () => {
    await expect(service.replacePreferences(7, { mealReminder: 'yes' as never })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.replacePreferences).not.toHaveBeenCalled();
  });
});
