import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren, type ReactElement } from "react";
import { AuthContext } from "@/app/AuthProvider";
import { useHouseholdsQuery } from "./api/householdsQueries";
import { PERSONAL_KITCHEN, householdScope, scopeKey, type KitchenScope } from "./householdScope";
import type { HouseholdRole, HouseholdSummary } from "./api/householdsApi";

export type HouseholdScopeValue = {
	scope: KitchenScope;
	canEdit: boolean;
	scopeLabel: string;
	households: HouseholdSummary[];
	selectScope: (scope: KitchenScope) => void;
	isLoading: boolean;
};

const defaultScope: HouseholdScopeValue = {
	scope: PERSONAL_KITCHEN,
	canEdit: true,
	scopeLabel: "Personal kitchen",
	households: [],
	selectScope: () => undefined,
	isLoading: false,
};

export const HouseholdScopeContext = createContext<HouseholdScopeValue>(defaultScope);

export const useHouseholdScope = (): HouseholdScopeValue => useContext(HouseholdScopeContext);

const STORAGE_KEY = "food-recipes:kitchen-scope";

const readStoredScope = (): KitchenScope => {
	if (typeof window === "undefined") return PERSONAL_KITCHEN;
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (!stored || stored === "personal") return PERSONAL_KITCHEN;
	const householdId = Number(stored.replace("household:", ""));
	return Number.isInteger(householdId) && householdId > 0 ? householdScope(householdId) : PERSONAL_KITCHEN;
};

const roleCanEdit = (role: HouseholdRole | undefined): boolean => role === "OWNER" || role === "MEMBER";

export const HouseholdScopeProvider = ({ children }: PropsWithChildren): ReactElement => {
	const { auth } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const householdsQuery = useHouseholdsQuery();
	const [scope, setScope] = useState<KitchenScope>(readStoredScope);
	const households = householdsQuery.data?.households ?? [];
	const selectedHousehold = scope.kind === "household"
		? households.find((household) => household.household_id === scope.householdId)
		: undefined;

	useEffect(() => {
		if (scope.kind === "household" && !selectedHousehold && !householdsQuery.isPending) {
			setScope(PERSONAL_KITCHEN);
			window.localStorage.setItem(STORAGE_KEY, "personal");
		}
	}, [householdsQuery.isPending, scope, selectedHousehold]);

	const selectScope = useCallback((nextScope: KitchenScope) => {
		setScope(nextScope);
		window.localStorage.setItem(STORAGE_KEY, scopeKey(nextScope));
		const userId = auth.current.userId;
		void Promise.all([
			queryClient.invalidateQueries({ queryKey: ["pantry", userId] }),
			queryClient.invalidateQueries({ queryKey: ["planning", userId] }),
			queryClient.invalidateQueries({ queryKey: ["shopping-list", userId] }),
		]);
	}, [auth, queryClient]);

	const value = useMemo<HouseholdScopeValue>(() => ({
		scope,
		canEdit: scope.kind === "personal" || roleCanEdit(selectedHousehold?.role),
		scopeLabel: selectedHousehold?.name ?? "Personal kitchen",
		households,
		selectScope,
		isLoading: householdsQuery.isPending,
	}), [households, householdsQuery.isPending, scope, selectScope, selectedHousehold]);

	return <HouseholdScopeContext.Provider value={value}>{children}</HouseholdScopeContext.Provider>;
};
