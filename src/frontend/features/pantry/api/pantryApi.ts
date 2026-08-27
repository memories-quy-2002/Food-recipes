import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export const PANTRY_UNITS = [
	"GRAM",
	"KILOGRAM",
	"MILLILITER",
	"LITER",
	"TEASPOON",
	"TABLESPOON",
	"CUP",
	"PIECE",
] as const;

export type PantryUnit = (typeof PANTRY_UNITS)[number];

export type PantryItem = {
	pantry_id: number;
	user_id?: number;
	name: string;
	have: boolean;
	quantity: number | null;
	unit: PantryUnit | string | null;
	updated_at?: string;
};

export type PantryResponse = { items: PantryItem[] };
export type PantryItemResponse = { item: PantryItem };

export const listPantry = async (signal?: AbortSignal): Promise<PantryResponse> => {
	const response = await axios.get<PantryResponse>(apiRoutes.pantry, { signal });
	return response.data;
};

export const createPantryItem = async (input: { name: string; quantity: number; unit: PantryUnit; have?: boolean }): Promise<PantryItemResponse> => {
	const response = await axios.post<PantryItemResponse>(apiRoutes.pantry, input);
	return response.data;
};

export const updatePantryItem = async (pantryId: number, input: { name?: string; quantity?: number | null; unit?: PantryUnit | null; have?: boolean }): Promise<PantryItemResponse> => {
	const response = await axios.patch<PantryItemResponse>(apiRoutes.pantryItem(pantryId), input);
	return response.data;
};

export const deletePantryItem = async (pantryId: number): Promise<{ message: string }> => {
	const response = await axios.delete<{ message: string }>(apiRoutes.pantryItem(pantryId));
	return response.data;
};
