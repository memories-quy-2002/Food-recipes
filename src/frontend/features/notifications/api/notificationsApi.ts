import axios from "@/shared/api/axios";

export type Notification = {
	notification_id: number;
	user_id?: number;
	kind?: string;
	title: string;
	body: string | null;
	action_path: string | null;
	dedupe_key?: string;
	read_at: string | null;
	created_at: string;
};

export type NotificationPreferences = {
	pantryExpiry: boolean;
	mealReminder: boolean;
	resumeCooking: boolean;
	weeklyPlan: boolean;
	householdActivity: boolean;
};

export const listNotifications = async (signal?: AbortSignal): Promise<{ notifications: Notification[] }> => {
	const response = await axios.get<{ notifications: Notification[] }>("/users/me/notifications", { signal });
	return response.data;
};

export const markNotificationRead = async (notificationId: number) => {
	const response = await axios.patch<{ message: string }>(`/users/me/notifications/${notificationId}/read`);
	return response.data;
};

export const markAllNotificationsRead = async () => {
	const response = await axios.post<{ updated: number }>("/users/me/notifications/read-all");
	return response.data;
};

export const getNotificationPreferences = async (): Promise<{ preferences: NotificationPreferences }> => {
	const response = await axios.get<{ preferences: NotificationPreferences }>("/users/me/notification-preferences");
	return response.data;
};

export const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>) => {
	const response = await axios.put<{ preferences: NotificationPreferences }>("/users/me/notification-preferences", preferences);
	return response.data;
};
