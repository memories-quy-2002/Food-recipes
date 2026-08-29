export type KitchenScope =
	| { kind: "personal" }
	| { kind: "household"; householdId: number };

export const PERSONAL_KITCHEN: KitchenScope = { kind: "personal" };

export const householdScope = (householdId: number): KitchenScope => ({
	kind: "household",
	householdId,
});

export const scopeKey = (scope: KitchenScope): string =>
	scope.kind === "personal" ? "personal" : `household:${scope.householdId}`;

export const isHouseholdScope = (
	scope: KitchenScope,
): scope is { kind: "household"; householdId: number } =>
	scope.kind === "household";
