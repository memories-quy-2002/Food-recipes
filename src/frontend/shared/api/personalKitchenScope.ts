export type KitchenScope = {
	kind: "personal";
};

export const PERSONAL_KITCHEN: KitchenScope = { kind: "personal" };

export const scopeKey = (_scope: KitchenScope): string => "personal";