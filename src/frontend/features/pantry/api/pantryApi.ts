import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type PantryItem = {
	pantry_id: number;
	user_id?: number;
	name: string;
	have: boolean;
	updated_at?: string;
};

export type PantryResponse = { items: PantryItem[] };
export type PantryItemResponse = { item: PantryItem };

export const listPantry = async (signal?: AbortSignal): Promise<PantryResponse> => {
	const response = await axios.get<PantryResponse>(apiRoutes.pantry, { signal });
	return response.data;
};

export const createPantryItem = async (input: { name: string; have?: boolean }): Promise<PantryItemResponse> => {
	const response = await axios.post<PantryItemResponse>(apiRoutes.pantry, input);
	return response.data;
};

export const updatePantryItem = async (pantryId: number, input: { name?: string; have?: boolean }): Promise<PantryItemResponse> => {
	const response = await axios.patch<PantryItemResponse>(apiRoutes.pantryItem(pantryId), input);
	return response.data;
};

export const deletePantryItem = async (pantryId: number): Promise<{ message: string }> => {
	const response = await axios.delete<{ message: string }>(apiRoutes.pantryItem(pantryId));
	return response.data;
};
