import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import type { KitchenScope } from "@/features/households/householdScope";

export type LeftoverBatch = {
	leftover_id: number;
	user_id: number | null;
	household_id: number | null;
	recipe_id: number;
	recipe_name: string;
	history_id: number;
	cooked_servings: number;
	remaining_servings: number;
	prepared_at: string;
	expires_at: string;
};

export type LeftoverListResponse = { items: LeftoverBatch[] };
export type LeftoverResponse = { leftover: LeftoverBatch };
export type CreateLeftoverInput = {
	cookingHistoryId: number;
	servings: number;
	expiresAt: string;
};

const getLeftoversRoute = (scope: KitchenScope): string =>
	scope.kind === "personal"
		? apiRoutes.userLeftovers
		: apiRoutes.householdLeftovers(scope.householdId);

export const listLeftovers = async (
	scope: KitchenScope,
	signal?: AbortSignal,
): Promise<LeftoverListResponse> => {
	const response = await axios.get<LeftoverListResponse>(getLeftoversRoute(scope), { signal });
	return response.data;
};

export const createLeftover = async (
	scope: KitchenScope,
	input: CreateLeftoverInput,
): Promise<LeftoverResponse> => {
	const response = await axios.post<LeftoverResponse>(getLeftoversRoute(scope), input);
	return response.data;
};
