import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import {
	applyMealPlanTemplate,
	createRecurringMealRule,
	deleteRecurringMealRule,
	listMealPlanTemplates,
	listRecurringMealRules,
	saveMealPlanTemplate,
	type ApplyMealPlanTemplateInput,
	type CreateRecurringMealRuleInput,
	type SaveMealPlanTemplateInput,
} from "./savedPlanningApi";

export const savedPlanningQueryKeys = {
	templates: (userId: number) => ["planning", "templates", userId] as const,
	recurring: (userId: number) => ["planning", "recurring", userId] as const,
};

export const useSavedPlanningQuery = (enabled = true) => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useQuery({
		queryKey: ["planning", "saved", userId],
		queryFn: async () => Promise.all([listMealPlanTemplates(), listRecurringMealRules()]),
		enabled: enabled && userId > 0,
	});
};

export const useSaveMealPlanTemplateMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	return useMutation({
		mutationFn: (input: SaveMealPlanTemplateInput) => saveMealPlanTemplate(input),
		onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["planning", "saved", auth.current.userId] }), queryClient.invalidateQueries({ queryKey: ["planning", "templates"] })]); showToast({ title: "Week saved as a template" }); },
		onError: () => showToast({ title: "Couldn’t save this week", message: "Please try again.", type: "error" }),
	});
};

export const useApplyMealPlanTemplateMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ templateId, input }: { templateId: number; input: ApplyMealPlanTemplateInput }) => applyMealPlanTemplate(templateId, input),
		onSuccess: async (result) => { await queryClient.invalidateQueries({ queryKey: ["planning"] }); showToast({ title: `${result.applied} meals added to your week` }); },
		onError: () => showToast({ title: "Couldn’t apply this template", message: "Check the target week and try again.", type: "error" }),
	});
};

export const useRecurringMealRulesQuery = (enabled = true) => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useQuery({ queryKey: savedPlanningQueryKeys.recurring(userId), queryFn: listRecurringMealRules, enabled: enabled && userId > 0 });
};

export const useCreateRecurringMealRuleMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	return useMutation({
		mutationFn: (input: CreateRecurringMealRuleInput) => createRecurringMealRule(input),
		onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: savedPlanningQueryKeys.recurring(auth.current.userId) }); showToast({ title: "Recurring meal added" }); },
		onError: () => showToast({ title: "Couldn’t add recurring meal", message: "Choose a published recipe and try again.", type: "error" }),
	});
};

export const useDeleteRecurringMealRuleMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	return useMutation({
		mutationFn: deleteRecurringMealRule,
		onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: savedPlanningQueryKeys.recurring(auth.current.userId) }); showToast({ title: "Recurring meal removed" }); },
		onError: () => showToast({ title: "Couldn’t remove recurring meal", type: "error" }),
	});
};
