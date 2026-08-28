import { updateShoppingItem } from "@/features/shopping/api/shoppingApi";
import { updateCookingSession } from "@/features/history/api/cookingSessionApi";
import type { OfflineOperation, SyncResult } from "./operationQueue";

export const syncOfflineOperation = async (operation: OfflineOperation): Promise<SyncResult> => {
	if (operation.kind === "shopping-check") {
		await updateShoppingItem(operation.itemId, { checked: operation.checked });
		return "applied";
	}
	await updateCookingSession(operation.sessionId, { currentStep: operation.currentStep });
	return "applied";
};
