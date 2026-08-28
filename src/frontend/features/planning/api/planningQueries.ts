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
	return useMutation<MealPlanResponse, Error, FromMealPlanPreviewInput>({
		mutationFn: createMealPlanFromPreview,
		onSuccess: async () => { await invalidatePlanning(queryClient); showToast({ title: "Meal plan saved" }); },
		onError: () => showToast({ title: "This preview could not be saved", message: "Your recipes may have changed. Generate a new preview and try again.", type: "error" }),
	});
};

const invalidatePlanning = async (queryClient: ReturnType<typeof useQueryClient>) => {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: planningQueryKeys.all }),
		queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
	]);
};

export const useCreateMealPlanMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (input: CreateMealPlanInput) => createMealPlan(input),
		onSuccess: async () => { await invalidatePlanning(queryClient); showToast({ title: "Meal plan created" }); },
		onError: () => showToast({ title: "Couldn’t create your meal plan", message: "Please try again.", type: "error" }),
	});
};

export const useAddMealPlanItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ planId, input }: { planId: number; input: AddMealPlanItemInput }) =>
			addMealPlanItem(planId, input),
		onSuccess: async () => { await invalidatePlanning(queryClient); showToast({ title: "Meal added to your plan" }); },
		onError: () => showToast({ title: "Couldn’t add this meal", message: "Choose another recipe or try again.", type: "error" }),
	});
};

export const useUpdateMealPlanItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({
			planId,
			itemId,
			input,
		}: { planId: number; itemId: number; input: UpdateMealPlanItemInput }) =>
			updateMealPlanItem(planId, itemId, input),
		onSuccess: async () => { await invalidatePlanning(queryClient); showToast({ title: "Meal plan updated" }); },
		onError: () => showToast({ title: "Couldn’t update this meal", message: "Please try again.", type: "error" }),
	});
};

export const useDeleteMealPlanItemMutation = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: ({ planId, itemId }: { planId: number; itemId: number }) =>
			deleteMealPlanItem(planId, itemId),
		onSuccess: async () => { await invalidatePlanning(queryClient); showToast({ title: "Meal removed from your plan" }); },
		onError: () => showToast({ title: "Couldn’t remove this meal", message: "Please try again.", type: "error" }),
	});
};
