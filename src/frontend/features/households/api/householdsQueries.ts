import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import { acceptHouseholdInvite, createHousehold, createHouseholdInvite, getHousehold, listHouseholds } from "./householdsApi";

export const householdQueryKeys = {
	all: ["households"] as const,
	forUser: (userId: number) => [...householdQueryKeys.all, userId] as const,
	detail: (householdId: number) => [...householdQueryKeys.all, "detail", householdId] as const,
};

export const useHouseholdsQuery = () => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	const isAuthReady = auth.current.hydrated && userId > 0;
	return useQuery({
		queryKey: householdQueryKeys.forUser(userId),
		queryFn: ({ signal }) => listHouseholds(signal),
		enabled: isAuthReady,
	});
};

export const useHouseholdQuery = (householdId: number | null) => useQuery({
	queryKey: householdQueryKeys.detail(householdId ?? 0),
	queryFn: () => getHousehold(householdId!),
	enabled: householdId !== null && householdId > 0,
});

export const useCreateHouseholdMutation = () => {
	const queryClient = useQueryClient();
	const { auth } = useContext(AuthContext);
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (name: string) => createHousehold(name),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: householdQueryKeys.forUser(auth.current.userId) });
			showToast({ title: "Household created" });
		},
		onError: () => showToast({ title: "Couldn’t create household", type: "error" }),
	});
};

export const useCreateHouseholdInviteMutation = () => {
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ householdId, email }: { householdId: number; email: string }) => createHouseholdInvite(householdId, email),
		onError: () => showToast({ title: "Couldn’t create invite", message: "Check the email and your household role.", type: "error" }),
	});
};

export const useAcceptHouseholdInviteMutation = () => {
	const queryClient = useQueryClient();
	const { auth } = useContext(AuthContext);
	const { showToast } = useToast();
	return useMutation({
		mutationFn: acceptHouseholdInvite,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: householdQueryKeys.forUser(auth.current.userId) });
			showToast({ title: "Invite accepted" });
		},
	});
};
