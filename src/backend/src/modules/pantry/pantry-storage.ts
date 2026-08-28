export const PANTRY_STORAGE_LOCATIONS = ['pantry', 'fridge', 'freezer', 'other'] as const;
export type PantryStorageLocation = (typeof PANTRY_STORAGE_LOCATIONS)[number];
