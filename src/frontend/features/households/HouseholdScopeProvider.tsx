import { createContext, useContext } from "react";
import { PERSONAL_KITCHEN, type KitchenScope } from "./householdScope";

export type HouseholdScopeValue = {
	scope: KitchenScope;
	canEdit: boolean;
	scopeLabel: string;
};

const defaultScope: HouseholdScopeValue = {
	scope: PERSONAL_KITCHEN,
	canEdit: true,
	scopeLabel: "My pantry",
};

export const HouseholdScopeContext = createContext<HouseholdScopeValue>(defaultScope);

export const useHouseholdScope = (): HouseholdScopeValue => useContext(HouseholdScopeContext);
