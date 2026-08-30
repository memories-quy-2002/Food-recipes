import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import { getNotificationPreferences, listNotifications, markAllNotificationsRead, markNotificationRead, updateNotificationPreferences, type NotificationPreferences } from "./notificationsApi";

export const notificationQueryKeys = {
	all: ["notifications"] as const,
	forUser: (userId: number) => [...notificationQueryKeys.all, userId] as const,
	preferences: (userId: number) => [...notificationQueryKeys.all, "preferences", userId] as const,
};

export const useNotificationsQuery = () => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	const isAuthReady = auth.current.hydrated && userId > 0;
	return useQuery({ queryKey: notificationQueryKeys.forUser(userId), queryFn: ({ signal }) => listNotifications(signal), enabled: isAuthReady, refetchInterval: 60_000 });
};

export const useMarkNotificationReadMutation = () => {
	const queryClient = useQueryClient();
	const { auth } = useContext(AuthContext);
	return useMutation({ mutationFn: markNotificationRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.forUser(auth.current.userId) }) });
};

export const useMarkAllNotificationsReadMutation = () => {
	const queryClient = useQueryClient();
	const { auth } = useContext(AuthContext);
	return useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.forUser(auth.current.userId) }) });
};

export const useNotificationPreferencesQuery = () => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	const isAuthReady = auth.current.hydrated && userId > 0;
	return useQuery({ queryKey: notificationQueryKeys.preferences(userId), queryFn: getNotificationPreferences, enabled: isAuthReady });
};

export const useUpdateNotificationPreferencesMutation = () => {
	const queryClient = useQueryClient();
	const { auth } = useContext(AuthContext);
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (preferences: Partial<NotificationPreferences>) => updateNotificationPreferences(preferences),
		onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: notificationQueryKeys.preferences(auth.current.userId) }); showToast({ title: "Notification preferences saved" }); },
		onError: () => showToast({ title: "Couldn’t save notification preferences", type: "error" }),
	});
};
