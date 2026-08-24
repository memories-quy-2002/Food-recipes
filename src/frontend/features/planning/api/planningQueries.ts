import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryFunctionContext,
} from "@tanstack/react-query";
import {
	addMealPlanItem,
	createMealPlan,
	deleteMealPlanItem,
	getMealPlan,
	listMealPlans,
	listSavedRecipeIds,
	updateMealPlanItem,
	type AddMealPlanItemInput,
	type CreateMealPlanInput,
	type DateRange,
	type MealPlanResponse,
	type UpdateMealPlanItemInput,
} from "./planningApi";

export const planningQueryKeys = {
	all: ["planning"] as const,
	week: (from: string, to: string, selectedDate?: string) =>
		["planning", "week", from, to, selectedDate ?? null] as const,
	savedRecipeIds: () => ["planning", "saved-recipe-ids"] as const,
};

type WeekQueryKey = ReturnType<typeof planningQueryKeys.week>;

const fetchMealPlanForWeek = async ({
	queryKey,
	signal,
}: QueryFunctionContext<WeekQueryKey>): Promise<MealPlanResponse | null> => {
	const [, , from, to, selectedDate] = queryKey;
	const listResponse = await listMealPlans({ from, to }, signal);
	const plan = listResponse.plans.find(
		(candidate) => {
			const startDate = candidate.start_date.slice(0, 10);
			const endDate = candidate.end_date.slice(0, 10);
			return selectedDate
				? startDate <= selectedDate && endDate >= selectedDate
				: endDate >= from && startDate <= to;
		},
	);

	return plan ? getMealPlan(plan.plan_id, signal) : null;
};

export const useMealPlanForWeekQuery = (
	range: DateRange,
	options: { enabled?: boolean; selectedDate?: string } = {},
) =>
	useQuery({
		queryKey: planningQueryKeys.week(range.from, range.to, options.selectedDate),
		queryFn: fetchMealPlanForWeek,
		enabled: options.enabled ?? true,
		placeholderData: (previousData) => previousData,
	});

export const useSavedRecipeIdsQuery = () =>
	useQuery({
		queryKey: planningQueryKeys.savedRecipeIds(),
		queryFn: listSavedRecipeIds,
	});

const invalidatePlanning = async (queryClient: ReturnType<typeof useQueryClient>) => {
	await queryClient.invalidateQueries({ queryKey: planningQueryKeys.all });
};

export const useCreateMealPlanMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateMealPlanInput) => createMealPlan(input),
		onSuccess: () => invalidatePlanning(queryClient),
	});
};

export const useAddMealPlanItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ planId, input }: { planId: number; input: AddMealPlanItemInput }) =>
			addMealPlanItem(planId, input),
		onSuccess: () => invalidatePlanning(queryClient),
	});
};

export const useUpdateMealPlanItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			planId,
			itemId,
			input,
		}: { planId: number; itemId: number; input: UpdateMealPlanItemInput }) =>
			updateMealPlanItem(planId, itemId, input),
		onSuccess: () => invalidatePlanning(queryClient),
	});
};

export const useDeleteMealPlanItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ planId, itemId }: { planId: number; itemId: number }) =>
			deleteMealPlanItem(planId, itemId),
		onSuccess: () => invalidatePlanning(queryClient),
	});
};
