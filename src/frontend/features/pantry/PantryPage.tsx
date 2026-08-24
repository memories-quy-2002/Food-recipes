import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import type { PantryItem } from "./api/pantryApi";
import {
	useCreatePantryItemMutation,
	useDeletePantryItemMutation,
	usePantryQuery,
	useUpdatePantryItemMutation,
} from "./api/pantryQueries";
import "./Pantry.scss";

const PantryPage = () => {
	const pantryQuery = usePantryQuery();
	const createMutation = useCreatePantryItemMutation();
	const updateMutation = useUpdatePantryItemMutation();
	const deleteMutation = useDeletePantryItemMutation();
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const items = pantryQuery.data?.items ?? [];
	const availableItems = items.filter((item) => item.have);
	const missingItems = items.filter((item) => !item.have);

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const nextName = name.trim();
		if (!nextName) {
			setError("Add an item name before saving.");
			return;
		}
		setError(null);
		createMutation.mutate({ name: nextName, have: true }, { onSuccess: () => setName(""), onError: () => setError("We could not add that pantry item. Try again.") });
	};

	const renderItem = (item: PantryItem) => (
		<li key={item.pantry_id} className={`pantry__item${item.have ? "" : " pantry__item--missing"}`}>
			<label>
				<input
					type="checkbox"
					checked={item.have}
					aria-label={`${item.name} available`}
					onChange={() => updateMutation.mutate({ pantryId: item.pantry_id, input: { have: !item.have } })}
				/>
				<span>{item.name}</span>
			</label>
			<button type="button" onClick={() => deleteMutation.mutate(item.pantry_id)} aria-label={`Delete ${item.name}`}>
				Delete
			</button>
		</li>
	);

	return (
		<div className="fr-page pantry">
			<PageHelmet title="My Pantry" description="Keep a simple list of ingredients you have on hand." path="/pantry" noIndex />
			<main className="pantry__main" aria-labelledby="pantry-title">
				<header className="pantry__header">
					<div>
						<p className="pantry__eyebrow">Kitchen inventory</p>
						<h1 id="pantry-title">My Pantry</h1>
						<p>Track what you have without guessing quantities. Use it as a quick reference while you shop and plan.</p>
					</div>
					<Link to="/shopping-list">Open shopping list</Link>
				</header>
				<section className="pantry__add" aria-labelledby="pantry-add-title">
					<h2 id="pantry-add-title">Add an ingredient</h2>
					<form onSubmit={submit}>
						<label htmlFor="pantry-item">Pantry item</label>
						<input id="pantry-item" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. olive oil" />
						<button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding…" : "Add pantry item"}</button>
					</form>
					{error && <p role="alert">{error}</p>}
				</section>
				{pantryQuery.isPending ? (
					<p className="pantry__state" role="status">Loading your pantry…</p>
				) : pantryQuery.isError ? (
					<section className="pantry__state" role="alert"><h2>Pantry could not load</h2><p>We could not fetch your pantry. Try again.</p><button type="button" onClick={() => pantryQuery.refetch()}>Try again</button></section>
				) : items.length === 0 ? (
					<section className="pantry__state"><h2>Your pantry is empty</h2><p>Add ingredients you already have so you can compare them with your shopping list.</p></section>
				) : (
					<section className="pantry__lists" aria-label="Pantry ingredients">
						<div><h2>Already have <span>{availableItems.length}</span></h2><ul>{availableItems.length ? availableItems.map(renderItem) : <li className="pantry__empty-line">Nothing marked as available.</li>}</ul></div>
						<div><h2>Need to get <span>{missingItems.length}</span></h2><ul>{missingItems.length ? missingItems.map(renderItem) : <li className="pantry__empty-line">Nothing waiting here.</li>}</ul></div>
					</section>
				)}
			</main>
		</div>
	);
};

export default PantryPage;
