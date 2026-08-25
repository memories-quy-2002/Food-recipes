import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import { getWeekRange } from "@/features/planning/api/planningDates";
import { useMealPlanForWeekQuery } from "@/features/planning/api/planningQueries";
import { usePantryQuery } from "@/features/pantry/api/pantryQueries";
import type { ShoppingListItem } from "./api/shoppingApi";
import {
	useAddRecipeIngredientsFromRecipesMutation,
	useAddShoppingItemMutation,
	useClearCompletedShoppingItemsMutation,
	useDeleteShoppingItemMutation,
	useShoppingListQuery,
	useUpdateShoppingItemMutation,
} from "./api/shoppingQueries";
import { isShoppingItemInPantry } from "./shoppingAvailability";
import "./ShoppingList.scss";

const ShoppingListPage = () => {
	const shoppingQuery = useShoppingListQuery();
	const addMutation = useAddShoppingItemMutation();
	const updateMutation = useUpdateShoppingItemMutation();
	const deleteMutation = useDeleteShoppingItemMutation();
	const clearMutation = useClearCompletedShoppingItemsMutation();
	const plannedIngredientsMutation = useAddRecipeIngredientsFromRecipesMutation();
	const mealPlanQuery = useMealPlanForWeekQuery(getWeekRange(new Date()));
	const pantryQuery = usePantryQuery();
	const [label, setLabel] = useState("");
	const [quantity, setQuantity] = useState("");
	const [editingItemId, setEditingItemId] = useState<number | null>(null);
	const [editLabel, setEditLabel] = useState("");
	const [editQuantity, setEditQuantity] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const items = shoppingQuery.data?.items ?? [];
	const activeItems = items.filter((item) => !item.checked);
	const completedItems = items.filter((item) => item.checked);
	const availablePantryNames = (pantryQuery.data?.items ?? []).filter((item) => item.have).map((item) => item.name);
	const plannedRecipeIds = [...new Set((mealPlanQuery.data?.items ?? []).map((item) => item.recipe_id))];
	const actionError =
		addMutation.isError || updateMutation.isError || deleteMutation.isError || clearMutation.isError || plannedIngredientsMutation.isError
			? "We could not save that change. Try again."
			: null;

	const importPlannedIngredients = () => {
		if (plannedRecipeIds.length === 0 || plannedIngredientsMutation.isPending) return;
		plannedIngredientsMutation.mutate(plannedRecipeIds, {
			onSuccess: (response) => setMessage(`${response.items.length} planned ingredient${response.items.length === 1 ? "" : "s"} added to your shopping list.`),
		});
	};

	const submitItem = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
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
		setEditingItemId(item.item_id);
		setEditLabel(item.label);
		setEditQuantity(item.quantity ?? "");
		setMessage(null);
	};

	const cancelEditing = () => {
		setEditingItemId(null);
		setEditLabel("");
		setEditQuantity("");
	};

	const saveEdit = (item: ShoppingListItem) => {
		const nextLabel = editLabel.trim();
		if (!nextLabel) {
			setMessage("An item needs a name before it can be saved.");
			return;
		}

		updateMutation.mutate({
			itemId: item.item_id,
			input: {
				label: nextLabel,
				quantity: editQuantity.trim(),
			},
		});
		cancelEditing();
		setMessage("Item updated.");
	};

	const toggleItem = (item: ShoppingListItem) => {
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
							<button type="button" className="shopping-list__button shopping-list__button--primary" onClick={() => saveEdit(item)}>
								Save changes
							</button>
							<button type="button" className="shopping-list__button shopping-list__button--quiet" onClick={cancelEditing}>
								Cancel
							</button>
						</div>
					</div>
				) : (
					<>
						<label className="shopping-list__check-control">
							<input
								type="checkbox"
								checked={item.checked}
								onChange={() => toggleItem(item)}
								aria-label={item.checked ? `Mark ${item.label} as not needed` : `Mark ${item.label} as purchased`}
							/>
							<span className="shopping-list__checkbox" aria-hidden="true" />
						</label>
						<div className="shopping-list__item-copy">
							<strong>{item.label}</strong>
							{item.quantity && <span>{item.quantity}</span>}
							{!item.checked && isShoppingItemInPantry(item.label, availablePantryNames) && <span className="shopping-list__availability" aria-label={`${item.label} is already in your pantry`}>In pantry</span>}
							{item.source_recipe_id && (
								<Link className="shopping-list__source" to={`/recipe?id=${item.source_recipe_id}`}>
									From {item.source_recipe_name || "Imported recipe"}
								</Link>
							)}
						</div>
						<div className="shopping-list__item-actions">
							<button type="button" className="shopping-list__button shopping-list__button--quiet" onClick={() => startEditing(item)}>
								<span className="shopping-list__button-label">Edit</span>
								<span className="shopping-list__sr-only"> {item.label}</span>
							</button>
							<button type="button" className="shopping-list__button shopping-list__button--danger" onClick={() => deleteMutation.mutate(item.item_id)}>
								<span className="shopping-list__button-label">Delete</span>
								<span className="shopping-list__sr-only"> {item.label}</span>
							</button>
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
						<p className="shopping-list-page__eyebrow">Your kitchen run</p>
						<h1 id="shopping-list-title">Shopping List</h1>
						<p>Keep the next shop clear, flexible, and close to the recipes you actually want to cook.</p>
					</div>
					<div className="shopping-list-page__header-links">
						<Link className="shopping-list-page__secondary-link" to="/planning">Back to planning</Link>
						<Link className="shopping-list-page__secondary-link" to="/pantry">My pantry</Link>
					</div>
				</header>

				{message && <p className="shopping-list-page__message" role="status">{message}</p>}

				<section className="shopping-list__layout" aria-label="Shopping list workspace">
					<section className="shopping-list__add-card" aria-labelledby="shopping-list-add-title">
						<p className="shopping-list-page__eyebrow">Add by hand</p>
						<h2 id="shopping-list-add-title">What do you need?</h2>
						<p>Keep quantities in the form you use at the market—“a handful” is perfectly valid.</p>
						<form onSubmit={submitItem}>
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
						</form>
						<section className="shopping-list__planned-import" aria-labelledby="planned-import-title">
							<h3 id="planned-import-title">From this week’s plan</h3>
							{mealPlanQuery.isError ? (
								<p role="alert">We could not read this week’s plan.</p>
							) : plannedRecipeIds.length === 0 ? (
								<p>Add meals to your plan to import their ingredients together.</p>
							) : (
								<button className="shopping-list__button shopping-list__button--quiet" type="button" onClick={importPlannedIngredients} disabled={plannedIngredientsMutation.isPending} aria-busy={plannedIngredientsMutation.isPending}>
									{plannedIngredientsMutation.isPending ? "Importing…" : `Import ${plannedRecipeIds.length} planned recipe${plannedRecipeIds.length === 1 ? "" : "s"}`}
								</button>
							)}
						</section>
					</section>

					<section className="shopping-list__items-card" aria-labelledby="shopping-list-items-title">
						<div className="shopping-list__card-heading">
							<div>
								<p className="shopping-list-page__eyebrow">The running list</p>
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
									{completedItems.length > 0 ? <ul>{completedItems.map(renderItem)}</ul> : <p className="shopping-list__section-note">Checked-off items will stay here until you clear them.</p>}
								</div>
							</>
						)}

						{completedItems.length > 0 && !shoppingQuery.isPending && !shoppingQuery.isError && (
							<div className="shopping-list__footer">
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
