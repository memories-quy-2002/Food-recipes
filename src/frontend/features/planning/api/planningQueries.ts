import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryFunctionContext,
} from "@tanstack/react-query";
import { useContext } from "react";
import {
	addMealPlanItem,
	createMealPlan,
	deleteMealPlanItem,
	getMealPlan,
	generateMealPlanPreview,
	createMealPlanFromPreview,
	listMealPlans,
	listSavedRecipeIds,
	updateMealPlanItem,
	type AddMealPlanItemInput,
	type CreateMealPlanInput,
	type DateRange,
	type MealPlanResponse,
	type GenerateMealPlanInput,
	type FromMealPlanPreviewInput,
	type MealPlanPreviewResponse,
	type UpdateMealPlanItemInput,
} from "./planningApi";
import { useToast } from "@/app/ToastProvider";
import { AuthContext } from "@/app/AuthProvider";
import { PERSONAL_KITCHEN, scopeKey, type KitchenScope } from "@/features/households/householdScope";

export const planningQueryKeys = {
	all: ["planning"] as const,
	forUser: (userId: number, scope: KitchenScope) =>
		[...planningQueryKeys.all, userId, scopeKey(scope)] as const,
	week: (
		userId: number,
		scope: KitchenScope,
		from: string,
		to: string,
		selectedDate?: string,
	) =>
		[
			...planningQueryKeys.forUser(userId, scope),
			"week",
			from,
			to,
			selectedDate ?? null,
		] as const,
	savedRecipeIds: (userId: number) =>
		[...planningQueryKeys.all, "saved-recipe-ids", userId] as const,
};

type WeekQueryKey = ReturnType<typeof planningQueryKeys.week>;

const fetchMealPlanForWeek = (scope: KitchenScope) => async ({
	queryKey,
	signal,
}: QueryFunctionContext<WeekQueryKey>): Promise<MealPlanResponse | null> => {
	const [, , , , from, to, selectedDate] = queryKey;
	const listResponse = await listMealPlans({ from, to }, signal, scope);
	const plan = listResponse.plans.find(
		(candidate) => {
			const startDate = candidate.start_date.slice(0, 10);
			const endDate = candidate.end_date.slice(0, 10);
			return selectedDate
				? startDate <= selectedDate && endDate >= selectedDate
				: endDate >= from && startDate <= to;
		},
	);

	return plan ? getMealPlan(plan.plan_id, signal, scope) : null;
};

export const useMealPlanForWeekQuery = (
	range: DateRange,
	options: { enabled?: boolean; selectedDate?: string } = {},
	scope: KitchenScope = PERSONAL_KITCHEN,
) => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;

	return useQuery({
		queryKey: planningQueryKeys.week(userId, scope, range.from, range.to, options.selectedDate),
		queryFn: fetchMealPlanForWeek(scope),
		enabled: (options.enabled ?? true) && userId > 0,
	});
};

export const useSavedRecipeIdsQuery = () => {
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;

	return useQuery({
		queryKey: planningQueryKeys.savedRecipeIds(userId),
		queryFn: listSavedRecipeIds,
		enabled: userId > 0,
	});
};

export const useGenerateMealPlanPreviewMutation = () => {
	const { showToast } = useToast();
	return useMutation<MealPlanPreviewResponse, Error, GenerateMealPlanInput>({
		mutationFn: generateMealPlanPreview,
		onError: () => showToast({ title: "Couldn’t generate your meal plan", message: "Try adjusting the week or your locked meals.", type: "error" }),
	});
};

export const useCreateMealPlanFromPreviewMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation<MealPlanResponse, Error, FromMealPlanPreviewInput>({
		mutationFn: createMealPlanFromPreview,
		onSuccess: async () => { await invalidatePlanning(queryClient, userId, PERSONAL_KITCHEN); showToast({ title: "Meal plan saved" }); },
		onError: () => showToast({ title: "This preview could not be saved", message: "Your recipes may have changed. Generate a new preview and try again.", type: "error" }),
	});
};

const invalidatePlanning = async (
	queryClient: ReturnType<typeof useQueryClient>,
	userId: number,
	scope: KitchenScope,
) => {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: planningQueryKeys.forUser(userId, scope) }),
		queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
	]);
};

export const useCreateMealPlanMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: (input: CreateMealPlanInput) => createMealPlan(input, scope),
		onSuccess: async () => { await invalidatePlanning(queryClient, userId, scope); showToast({ title: "Meal plan created" }); },
		onError: () => showToast({ title: "Couldn’t create your meal plan", message: "Please try again.", type: "error" }),
	});
};

export const useAddMealPlanItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: ({ planId, input }: { planId: number; input: AddMealPlanItemInput }) =>
			addMealPlanItem(planId, input, scope),
		onSuccess: async () => { await invalidatePlanning(queryClient, userId, scope); showToast({ title: "Meal added to your plan" }); },
		onError: () => showToast({ title: "Couldn’t add this meal", message: "Choose another recipe or try again.", type: "error" }),
	});
};

export const useUpdateMealPlanItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: ({
			planId,
			itemId,
			input,
		}: { planId: number; itemId: number; input: UpdateMealPlanItemInput }) =>
			updateMealPlanItem(planId, itemId, input, scope),
		onSuccess: async () => { await invalidatePlanning(queryClient, userId, scope); showToast({ title: "Meal plan updated" }); },
		onError: () => showToast({ title: "Couldn’t update this meal", message: "Please try again.", type: "error" }),
	});
};

export const useDeleteMealPlanItemMutation = (scope: KitchenScope = PERSONAL_KITCHEN) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { auth } = useContext(AuthContext);
	const userId = auth.current.userId;
	return useMutation({
		mutationFn: ({ planId, itemId }: { planId: number; itemId: number }) =>
			deleteMealPlanItem(planId, itemId, scope),
		onSuccess: async () => { await invalidatePlanning(queryClient, userId, scope); showToast({ title: "Meal removed from your plan" }); },
		onError: () => showToast({ title: "Couldn’t remove this meal", message: "Please try again.", type: "error" }),
	});
};
