import type { KitchenScope } from "@/features/households/householdScope";

const scopePart = (scope: KitchenScope): string => scope.kind === "personal" ? "personal" : `household-${scope.householdId}`;

export const cacheKeys = {
	activeRecipe: (recipeId: number | string) => `recipe:${String(recipeId)}`,
	activeCookingSession: (userId: number, sessionId: number | string) => `cooking-session:${userId}:${String(sessionId)}`,
	shoppingList: (userId: number, scope: KitchenScope) => `shopping-list:${userId}:${scopePart(scope)}`,
	mealPlanSummary: (userId: number, scope: KitchenScope) => `meal-plan-summary:${userId}:${scopePart(scope)}`,
};

export const isOfflineCacheKey = (key: string): boolean => !/(token|jwt|refresh|password|secret)/i.test(key);
