import { useHouseholdScope } from "./HouseholdScopeProvider";
import { householdScope, PERSONAL_KITCHEN } from "./householdScope";

const HouseholdScopeSelector = () => {
	const { scope, households, selectScope, isLoading } = useHouseholdScope();
	if (!isLoading && households.length === 0) return null;

	return (
		<div className="grid min-w-0 gap-1">
			<label className="sr-only" htmlFor="kitchen-scope">Kitchen scope</label>
			<select
				id="kitchen-scope"
				className="min-h-11 max-w-[13rem] rounded-xl border border-input bg-background px-3 py-2 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				value={scope.kind === "personal" ? "personal" : `household:${scope.householdId}`}
				onChange={(event) => selectScope(event.target.value === "personal" ? PERSONAL_KITCHEN : householdScope(Number(event.target.value.replace("household:", ""))))}
				aria-label="Kitchen scope"
			>
				<option value="personal">Personal kitchen</option>
				{households.map((household) => <option key={household.household_id} value={`household:${household.household_id}`}>{household.name}{household.role === "VIEWER" ? " · read only" : ""}</option>)}
			</select>
		</div>
	);
};

export default HouseholdScopeSelector;
