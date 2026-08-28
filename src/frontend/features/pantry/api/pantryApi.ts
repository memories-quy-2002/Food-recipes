import axios from "@/shared/api/axios";
import { createPantryRoutes } from "@/shared/api/routes";
import { PERSONAL_KITCHEN, type KitchenScope } from "@/features/households/householdScope";

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

export const PANTRY_STORAGE_LOCATIONS = ["pantry", "fridge", "freezer", "other"] as const;
export type PantryStorageLocation = (typeof PANTRY_STORAGE_LOCATIONS)[number];
export type PantryExpiryStatus = "none" | "fresh" | "use_soon" | "expired";

export type PantryItem = {
	pantry_id: number;
	user_id?: number;
	name: string;
	have: boolean;
	quantity: number | null;
	unit: PantryUnit | string | null;
	purchased_at?: string | null;
	opened_at?: string | null;
	expires_at?: string | null;
	storage_location?: PantryStorageLocation | string | null;
	expiry_status?: PantryExpiryStatus;
	updated_at?: string;
};

export type PantryResponse = { items: PantryItem[] };
export type PantryItemResponse = { item: PantryItem };

export const listPantry = async (
	scope: KitchenScope = PERSONAL_KITCHEN,
	signal?: AbortSignal,
): Promise<PantryResponse> => {
	const response = await axios.get<PantryResponse>(createPantryRoutes(scope).pantry, { signal });
	return response.data;
};

export type PantryItemInput = {
	name: string;
	quantity?: number | null;
	unit?: PantryUnit | null;
	have?: boolean;
	purchasedAt?: string | null;
	openedAt?: string | null;
	expiresAt?: string | null;
	storageLocation?: PantryStorageLocation | null;
};

export const createPantryItem = async (
	input: PantryItemInput,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<PantryItemResponse> => {
	const response = await axios.post<PantryItemResponse>(createPantryRoutes(scope).pantry, input);
	return response.data;
};

export const updatePantryItem = async (
	pantryId: number,
	input: Partial<PantryItemInput>,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<PantryItemResponse> => {
	const response = await axios.patch<PantryItemResponse>(createPantryRoutes(scope).pantryItem(pantryId), input);
	return response.data;
};

export const deletePantryItem = async (
	pantryId: number,
	scope: KitchenScope = PERSONAL_KITCHEN,
): Promise<{ message: string }> => {
	const response = await axios.delete<{ message: string }>(createPantryRoutes(scope).pantryItem(pantryId));
	return response.data;
};
