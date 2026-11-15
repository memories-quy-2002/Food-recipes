import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CalendarDays, CheckCircle2, Pencil, ShoppingBasket, Trash2 } from "lucide-react";
import PageHelmet from "@/shared/seo/PageHelmet";
import { getWeekRange } from "@/features/planning/api/planningDates";
import { useMealPlanForWeekQuery } from "@/features/planning/api/planningQueries";
import { usePantryQuery } from "@/features/pantry/api/pantryQueries";
import type { ShoppingListItem, WeeklyShoppingPreview } from "./api/shoppingApi";
import {
	usePreviewWeeklyShoppingMutation,
	useConfirmWeeklyShoppingMutation,
	useAddShoppingItemMutation,
	useClearCompletedShoppingItemsMutation,
	useDeleteShoppingItemMutation,
	useShoppingListQuery,
	useImportCheckedShoppingItemsMutation,
	useUpdateShoppingItemMutation,
} from "./api/shoppingQueries";
import { isShoppingItemInPantry } from "./shoppingAvailability";
import "./ShoppingList.css";
import { useHouseholdScope } from "@/features/households/HouseholdScopeProvider";

const unitLabels: Record<string, string> = { GRAM: "g", KILOGRAM: "kg", MILLILITER: "ml", LITER: "L", PIECE: "pcs", TEASPOON: "tsp", TABLESPOON: "tbsp", CUP: "cup" };

const ShoppingListPage = () => {
	const { scope, canEdit, scopeLabel } = useHouseholdScope();
	const shoppingQuery = useShoppingListQuery(scope);
	const addMutation = useAddShoppingItemMutation(scope);
	const updateMutation = useUpdateShoppingItemMutation(scope);
	const deleteMutation = useDeleteShoppingItemMutation(scope);
	const clearMutation = useClearCompletedShoppingItemsMutation(scope);
	const weeklyPreviewMutation = usePreviewWeeklyShoppingMutation(scope);
	const weeklyConfirmMutation = useConfirmWeeklyShoppingMutation(scope);
	const importToPantryMutation = useImportCheckedShoppingItemsMutation(scope);
	const [searchParams] = useSearchParams();
	const requestedWeek = searchParams.get("week");
	const parsedWeek = requestedWeek && /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek)
		? new Date(`${requestedWeek}T12:00:00`)
		: null;
	const selectedWeek = getWeekRange(parsedWeek && Number.isFinite(parsedWeek.getTime()) ? parsedWeek : new Date());
	const mealPlanQuery = useMealPlanForWeekQuery(selectedWeek, {}, scope);
	const pantryQuery = usePantryQuery(scope);
	const [label, setLabel] = useState("");
	const [quantity, setQuantity] = useState("");
	const [editingItemId, setEditingItemId] = useState<number | null>(null);
	const [editLabel, setEditLabel] = useState("");
	const [editQuantity, setEditQuantity] = useState("");
	const [editError, setEditError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [weeklyPreview, setWeeklyPreview] = useState<WeeklyShoppingPreview | null>(null);
	const [acceptPartialPreview, setAcceptPartialPreview] = useState(false);
	const [weeklyError, setWeeklyError] = useState<string | null>(null);
	const scopeIdentity = scope.kind === "personal" ? "personal" : `household:${scope.householdId}`;
	useEffect(() => {
		setWeeklyPreview(null);
		setAcceptPartialPreview(false);
		setWeeklyError(null);
	}, [scopeIdentity]);

	const items = shoppingQuery.data?.items ?? [];
	const activeItems = items.filter((item) => !item.checked);
	const completedItems = items.filter((item) => item.checked);
	const availablePantryNames = (pantryQuery.data?.items ?? []).filter((item) => item.have && (item.quantity === null || item.quantity > 0)).map((item) => item.name);
	const selectedPlanId = mealPlanQuery.data?.plan?.plan_id;
	const pendingWeeklyItems = weeklyPreview?.items.filter((item) => !item.alreadyListed) ?? [];
	const needsPartialConfirmation = Boolean(weeklyPreview?.skippedRecipes.length);
	const canConfirmWeekly = canEdit && pendingWeeklyItems.length > 0 && (!needsPartialConfirmation || acceptPartialPreview) && !weeklyConfirmMutation.isPending;
	const actionError =
		addMutation.isError || updateMutation.isError || deleteMutation.isError || clearMutation.isError || weeklyPreviewMutation.isError || weeklyConfirmMutation.isError || importToPantryMutation.isError
			? "We could not save that change. Try again."
			: null;

	const previewPlannedIngredients = () => {
		if (!selectedPlanId || weeklyPreviewMutation.isPending || weeklyConfirmMutation.isPending) return;
		setWeeklyPreview(null);
		setAcceptPartialPreview(false);
		setWeeklyError(null);
		setMessage(null);
		weeklyPreviewMutation.mutate({ planId: selectedPlanId, ...selectedWeek }, {
			onSuccess: setWeeklyPreview,
			onError: () => setWeeklyError("We couldn’t calculate your weekly ingredients. Check your connection and try again."),
		});
	};

	const confirmPlannedIngredients = () => {
		if (!canConfirmWeekly || !weeklyPreview) return;
		weeklyConfirmMutation.mutate(
			{ planId: weeklyPreview.planId, from: weeklyPreview.from, to: weeklyPreview.to, snapshot: weeklyPreview.snapshot },
			{
				onSuccess: (result) => {
					setWeeklyPreview(null);
					setAcceptPartialPreview(false);
					setMessage(`${result.addedShoppingItems} weekly ingredient${result.addedShoppingItems === 1 ? "" : "s"} added to your shopping list.`);
				},
				onError: () => {
					setWeeklyPreview(null);
					setWeeklyError("Your meal plan, pantry, or list may have changed. Preview again.");
					setMessage("Your meal plan, pantry, or list may have changed. Preview again.");
				},
			},
		);
	};

	const importPurchasedItems = () => {
		if (!canEdit || completedItems.length === 0 || importToPantryMutation.isPending) return;
		importToPantryMutation.mutate(undefined, {
			onSuccess: (response) => {
				if (response.skipped_items.length > 0) {
					setMessage(`${response.imported_items} purchased item${response.imported_items === 1 ? "" : "s"} added to your pantry. ${response.skipped_items.length} item${response.skipped_items.length === 1 ? " needs" : "s need"} a quantity and unit.`);
				} else {
					setMessage(`${response.imported_items} purchased item${response.imported_items === 1 ? "" : "s"} added to your pantry.`);
				}
			},
		});
	};

	const submitItem = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canEdit) return;
		const nextLabel = label.trim();
		if (!nextLabel) {
			setFormError("Add an item name before saving.");
			return;
		}

		setFormError(null);
		addMutation.mutate(
			{ label: nextLabel, ...(quantity.trim() ? { quantity: quantity.trim() } : {}) },
			{
				onSuccess: () => {
					setLabel("");
					setQuantity("");
					setMessage("Item added to your shopping list.");
				},
			},
		);
	};

	const startEditing = (item: ShoppingListItem) => {
		if (!canEdit) return;
		setEditingItemId(item.item_id);
		setEditLabel(item.label);
		setEditQuantity(item.quantity ?? "");
		setEditError(null);
		setMessage(null);
	};

	const cancelEditing = () => {
		setEditingItemId(null);
		setEditLabel("");
		setEditQuantity("");
		setEditError(null);
	};

	const saveEdit = (item: ShoppingListItem) => {
		const nextLabel = editLabel.trim();
		if (!nextLabel) {
			setEditError("An item needs a name before it can be saved.");
			return;
		}

		setEditError(null);
		updateMutation.mutate({
			itemId: item.item_id,
			input: {
				label: nextLabel,
				quantity: editQuantity.trim(),
			},
		}, {
			onSuccess: () => {
				cancelEditing();
				setMessage("Item updated.");
			},
			onError: () => setEditError("We could not update this item. Try again."),
		});
	};

	const toggleItem = (item: ShoppingListItem) => {
		if (!canEdit) return;
		updateMutation.mutate({ itemId: item.item_id, input: { checked: !item.checked } });
	};

	const renderItem = (item: ShoppingListItem) => {
		const isEditing = editingItemId === item.item_id;
		return (
			<li className={`shopping-list__item${item.checked ? " shopping-list__item--completed" : ""}`} key={item.item_id}>
				{isEditing ? (
					<div className="shopping-list__edit-form">
						<label>
							<span>Item</span>
							<input
								value={editLabel}
								onChange={(event) => setEditLabel(event.target.value)}
								autoFocus
							/>
						</label>
						<label>
							<span>Quantity</span>
							<input
								value={editQuantity}
								onChange={(event) => setEditQuantity(event.target.value)}
							/>
						</label>
						<div className="shopping-list__item-actions">
							<button type="button" className="shopping-list__button shopping-list__button--primary" onClick={() => saveEdit(item)} disabled={updateMutation.isPending} aria-busy={updateMutation.isPending}>
								{updateMutation.isPending ? "Saving..." : "Save changes"}
							</button>
							<button type="button" className="shopping-list__button shopping-list__button--quiet" onClick={cancelEditing}>
								Cancel
							</button>
						</div>
					{editError && <p className="shopping-list-page__inline-error" role="alert">{editError}</p>}
					</div>
				) : (
					<>
						<label className="shopping-list__check-control">
							<input
								type="checkbox"
								checked={item.checked}
								disabled={!canEdit}
								onChange={() => toggleItem(item)}
								aria-label={item.checked ? `Mark ${item.label} as not needed` : `Mark ${item.label} as purchased`}
							/>
							<span className="shopping-list__checkbox" aria-hidden="true" />
						</label>
						<div className="shopping-list__item-copy">
							<strong>{item.label}</strong>
							{item.quantity && <span>{item.quantity}</span>}
							{!item.checked && isShoppingItemInPantry(item.label, availablePantryNames) && <span className="shopping-list__availability">In pantry</span>}
							{item.source_recipe_id && (
								<Link className="shopping-list__source" to={`/recipe?id=${item.source_recipe_id}`}>
									From {item.source_recipe_name || "Imported recipe"}
								</Link>
							)}
						</div>
						<div className="shopping-list__item-actions">
							{canEdit && <button type="button" className="shopping-list__button shopping-list__button--quiet shopping-list__button--icon" onClick={() => startEditing(item)} aria-label={`Edit ${item.label}`} title="Edit item">
								<Pencil className="size-4" aria-hidden="true" />
							</button>}
							{canEdit && <button type="button" className="shopping-list__button shopping-list__button--danger shopping-list__button--icon" onClick={() => deleteMutation.mutate(item.item_id)} aria-label={`Delete ${item.label}`} title="Delete item">
								<Trash2 className="size-4" aria-hidden="true" />
							</button>}
						</div>
					</>
				)}
			</li>
		);
	};

	return (
		<div className="fr-page shopping-list-page">
			<PageHelmet
				title="Shopping List"
				description="Keep ingredients, quantities, and recipe sources together for your next shop."
				path="/shopping-list"
				noIndex
			/>
			<main className="shopping-list-page__main" aria-labelledby="shopping-list-title">
				<header className="shopping-list-page__header">
					<div>
						<p className="shopping-list-page__eyebrow">{scopeLabel}</p>
						<h1 id="shopping-list-title">Shopping List</h1>
						<p>Keep the next shop clear, flexible, and close to the recipes you actually want to cook.</p>
						{!canEdit && <p role="status">You have read-only access to this kitchen.</p>}
					</div>
					<div className="shopping-list-page__header-links">
						<Link className="shopping-list-page__secondary-link" to="/planning">Back to planning</Link>
						<Link className="shopping-list-page__secondary-link" to="/pantry">My pantry</Link>
					</div>
				</header>

				{message && <p className="shopping-list-page__message" role="status">{message}</p>}

				<section className="shopping-list__layout" aria-label="Shopping list workspace">
					<section className="shopping-list__add-card" aria-labelledby="shopping-list-add-title">
						<h2 id="shopping-list-add-title">What do you need?</h2>
						<p>Keep quantities in the form you use at the market—“a handful” is perfectly valid.</p>
						{canEdit && <form onSubmit={submitItem}>
							<label>
								<span>Item</span>
								<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. lemons" />
							</label>
							<label>
								<span>Quantity <em>(optional)</em></span>
								<input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="e.g. 4" />
							</label>
							<button className="shopping-list__button shopping-list__button--primary shopping-list__add-button" type="submit" disabled={addMutation.isPending} aria-busy={addMutation.isPending}>
								{addMutation.isPending ? "Adding..." : "Add item"}
							</button>
							{formError && <p className="shopping-list-page__inline-error" role="alert">{formError}</p>}
							{actionError && <p className="shopping-list-page__inline-error" role="alert">{actionError}</p>}
						</form>}
					</section>
					<section className="shopping-list__weekly-card" aria-labelledby="weekly-shopping-title">
						<div className="shopping-list__weekly-heading">
							<div className="shopping-list__weekly-heading-icon" aria-hidden="true"><CalendarDays size={22} /></div>
							<div className="shopping-list__weekly-heading-copy">
								<p className="shopping-list__weekly-eyebrow">FROM YOUR MEAL PLAN</p>
								<h2 id="weekly-shopping-title">Smart weekly shopping</h2>
								<p>Combine this week’s ingredients, compare with your pantry, then review before adding.</p>
							</div>
							<span className="shopping-list__weekly-range">{selectedWeek.from} – {selectedWeek.to}</span>
						</div>
						{mealPlanQuery.isPending ? (
							<p className="shopping-list__weekly-info" role="status">Loading this week’s meal plan…</p>
						) : mealPlanQuery.isError ? (
							<div className="shopping-list__weekly-alert" role="alert">We couldn’t load this week’s plan. <button type="button" onClick={() => void mealPlanQuery.refetch()}>Try again</button></div>
						) : !selectedPlanId ? (
							<div className="shopping-list__weekly-empty">
								<ShoppingBasket size={22} aria-hidden="true" />
								<p>Add meals to this week’s plan to preview your shopping needs.</p>
								<Link to="/planning" className="shopping-list__button shopping-list__button--quiet">Open meal planner</Link>
							</div>
						) : (
							<div className="shopping-list__weekly-start">
								<button className="shopping-list__button shopping-list__button--quiet" type="button" onClick={previewPlannedIngredients} disabled={weeklyPreviewMutation.isPending || weeklyConfirmMutation.isPending} aria-busy={weeklyPreviewMutation.isPending}>
									{weeklyPreviewMutation.isPending ? "Calculating…" : weeklyPreview ? "Refresh weekly preview" : "Preview weekly ingredients"}
								</button>
								{!canEdit && <span className="shopping-list__weekly-info">View only · household members with edit access can add items.</span>}
							</div>
						)}
						{weeklyError && <p role="alert" className="shopping-list__weekly-alert">{weeklyError}</p>}
						{weeklyPreview && <section className="shopping-list__weekly-review" aria-label="Weekly shopping preview">
							<div className="shopping-list__weekly-summary" role="status">
								<CheckCircle2 size={19} aria-hidden="true" />
								<span>{weeklyPreview.mealCount} planned meal{weeklyPreview.mealCount === 1 ? "" : "s"} reviewed · {pendingWeeklyItems.length} ingredient{pendingWeeklyItems.length === 1 ? "" : "s"} to add</span>
							</div>
							{weeklyPreview.items.length > 0 ? <div className="shopping-list__weekly-table-wrap">
								<table className="shopping-list__weekly-table">
									<caption className="shopping-list__sr-only">Ingredients required for the selected week</caption>
									<thead><tr><th scope="col">Ingredient</th><th scope="col">Needed</th><th scope="col">In pantry</th><th scope="col">To buy</th></tr></thead>
									<tbody>{weeklyPreview.items.map((item) => {
										const unit = unitLabels[item.unit] ?? item.unit.toLowerCase();
										return <tr key={`${item.name}:${item.unit}`}>
											<th scope="row">{item.name}{item.alreadyListed && <span className="shopping-list__weekly-listed">Already on your list</span>}</th>
											<td data-label="Needed">{item.requiredQuantity} {unit}</td>
											<td data-label="In pantry">{item.availableQuantity} {unit}</td>
											<td data-label="To buy" className="shopping-list__weekly-shortage">{item.quantity} to buy</td>
										</tr>;
									})}</tbody>
								</table>
							</div> : <p className="shopping-list__weekly-info">No additional measured ingredients needed.</p>}
							{weeklyPreview.needsDetails.length > 0 && <div className="shopping-list__weekly-alert shopping-list__weekly-alert--muted">
								<AlertTriangle size={18} aria-hidden="true" />
								<p>Check quantities manually: {weeklyPreview.needsDetails.join(", ")}. These ingredients won’t be added automatically.</p>
							</div>}
							{needsPartialConfirmation && <div className="shopping-list__weekly-alert shopping-list__weekly-alert--caution" role="alert">
								<AlertTriangle size={18} aria-hidden="true" />
								<div>
									<p><strong>Incomplete shopping estimate.</strong> {weeklyPreview.skippedRecipes.length} recipe{weeklyPreview.skippedRecipes.length === 1 ? " was" : "s were"} unavailable and could not be included.</p>
									{canEdit && <label className="shopping-list__weekly-acknowledge">
										<input type="checkbox" checked={acceptPartialPreview} onChange={(event) => setAcceptPartialPreview(event.target.checked)} />
										<span>I understand this list is incomplete and want to add the available items anyway.</span>
									</label>}
								</div>
							</div>}
							<div className="shopping-list__weekly-actions">
								{canEdit && <button type="button" className="shopping-list__button shopping-list__button--primary" onClick={confirmPlannedIngredients} disabled={!canConfirmWeekly} aria-busy={weeklyConfirmMutation.isPending}>
									{weeklyConfirmMutation.isPending ? "Confirming…" : "Confirm & add missing items"}
								</button>}
								<button type="button" className="shopping-list__button shopping-list__button--quiet" onClick={() => { setWeeklyPreview(null); setAcceptPartialPreview(false); }} disabled={weeklyConfirmMutation.isPending}>Cancel</button>
							</div>
						</section>}
					</section>

					<section className="shopping-list__items-card" aria-labelledby="shopping-list-items-title">
						<div className="shopping-list__card-heading">
							<div>
								<h2 id="shopping-list-items-title">Ready when you are</h2>
							</div>
							<span className="shopping-list__count">{activeItems.length} to buy</span>
						</div>

						{shoppingQuery.isPending ? (
							<div className="shopping-list__skeleton" role="status" aria-label="Loading your shopping list">
								<div />
								<div />
								<div />
							</div>
						) : shoppingQuery.isError ? (
							<div className="shopping-list__state shopping-list__state--error" role="alert">
								<h3>Your list could not load</h3>
								<p>We could not fetch your ingredients. Try again to bring the list back in sync.</p>
								<button type="button" className="shopping-list__button shopping-list__button--quiet" onClick={() => shoppingQuery.refetch()}>Try again</button>
							</div>
						) : items.length === 0 ? (
							<div className="shopping-list__state shopping-list__state--empty">
								<div className="shopping-list__state-mark" aria-hidden="true">+</div>
								<h3>Your shopping list is empty</h3>
								<p>Add a market note above or bring ingredients over from one of your recipes.</p>
								<Link className="shopping-list__button shopping-list__button--primary" to="/food">Browse recipes</Link>
							</div>
						) : (
							<>
								<div className="shopping-list__section">
									<div className="shopping-list__section-heading">
										<h3>To buy</h3>
										<span>{activeItems.length}</span>
									</div>
									{activeItems.length > 0 ? <ul>{activeItems.map(renderItem)}</ul> : <p className="shopping-list__section-note">Everything is checked off. Nice work.</p>}
								</div>
								<div className="shopping-list__section shopping-list__section--completed">
									<div className="shopping-list__section-heading">
										<h3>Completed</h3>
										<span>{completedItems.length}</span>
									</div>
									{completedItems.length > 0 && <p className="shopping-list__section-note">Add purchased items to your pantry before cooking so quantities can be checked and deducted.</p>}
									{completedItems.length > 0 ? <ul>{completedItems.map(renderItem)}</ul> : <p className="shopping-list__section-note">Checked-off items will stay here until you clear them.</p>}
								</div>
							</>
						)}

						{canEdit && completedItems.length > 0 && !shoppingQuery.isPending && !shoppingQuery.isError && (
							<div className="shopping-list__footer">
								<button type="button" className="shopping-list__button shopping-list__button--primary" onClick={importPurchasedItems} disabled={importToPantryMutation.isPending} aria-busy={importToPantryMutation.isPending}>
									{importToPantryMutation.isPending ? "Adding to pantry…" : "Add purchased items to pantry"}
								</button>
								<button type="button" className="shopping-list__button shopping-list__button--quiet" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending} aria-busy={clearMutation.isPending}>
									{clearMutation.isPending ? "Clearing..." : "Clear completed"}
								</button>
							</div>
						)}
					</section>
				</section>
			</main>
		</div>
	);
};

export default ShoppingListPage;
