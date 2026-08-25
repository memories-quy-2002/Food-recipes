import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBasket, Trash2 } from "lucide-react";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import type { PantryItem } from "./api/pantryApi";
import {
	useCreatePantryItemMutation,
	useDeletePantryItemMutation,
	usePantryQuery,
	useUpdatePantryItemMutation,
} from "./api/pantryQueries";

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
		createMutation.mutate(
			{ name: nextName, have: true },
			{
				onSuccess: () => setName(""),
				onError: () => setError("We could not add that pantry item. Try again."),
			},
		);
	};

	const renderItem = (item: PantryItem) => (
		<li key={item.pantry_id} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
			<label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					checked={item.have}
					aria-label={`${item.name} available`}
					className="size-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onChange={() => updateMutation.mutate({ pantryId: item.pantry_id, input: { have: !item.have } })}
				/>
				<span className={item.have ? "truncate font-semibold text-foreground" : "truncate font-semibold text-muted-foreground line-through"}>{item.name}</span>
			</label>
			<Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(item.pantry_id)} aria-label={`Delete ${item.name}`}>
				<Trash2 className="size-4" aria-hidden="true" />
			</Button>
		</li>
	);

	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="pantry-title">
			<PageHelmet title="My Pantry" description="Keep a simple list of ingredients you have on hand." path="/pantry" noIndex />
			<div className="mx-auto w-full max-w-6xl">
				<header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div className="max-w-2xl">
						<p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">Kitchen inventory</p>
						<h1 id="pantry-title" className="text-4xl font-black tracking-tight sm:text-5xl">Know what you already have</h1>
						<p className="mt-3 text-base leading-7 text-muted-foreground">Keep a lightweight inventory so shopping and meal planning start with what is already in your kitchen.</p>
					</div>
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button asChild variant="outline" className="flex-1"><Link to="/food"><Search className="size-4" aria-hidden="true" />Find pantry recipes</Link></Button><Button asChild variant="outline" className="flex-1"><Link to="/shopping-list"><ShoppingBasket className="size-4" aria-hidden="true" />Open shopping list</Link></Button></div>
				</header>

				<Card className="mb-6 p-4 sm:p-5">
					<div className="mb-4"><h2 className="text-xl font-black">Add an ingredient</h2><p className="mt-1 text-sm text-muted-foreground">Quantities are optional here — this list is about availability.</p></div>
					<form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<div className="grid flex-1 gap-2"><label htmlFor="pantry-item" className="text-sm font-bold">Pantry item</label><Input id="pantry-item" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. olive oil" /></div>
						<Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding…" : "Add pantry item"}</Button>
					</form>
					{error && <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">{error}</p>}
				</Card>

				{pantryQuery.isPending ? (
					<Card className="p-8 text-center" role="status">Loading your pantry…</Card>
				) : pantryQuery.isError ? (
					<Card className="p-6 text-center" role="alert"><h2 className="text-xl font-bold">Pantry could not load</h2><p className="mt-2 text-muted-foreground">We could not fetch your pantry. Try again.</p><Button className="mt-4" onClick={() => pantryQuery.refetch()}>Try again</Button></Card>
				) : items.length === 0 ? (
					<Card className="p-8 text-center"><h2 className="text-xl font-bold">Your pantry is empty</h2><p className="mt-2 text-muted-foreground">Add ingredients you already have so you can compare them with your shopping list.</p></Card>
				) : (
					<section className="grid gap-5 md:grid-cols-2" aria-label="Pantry ingredients">
						<Card className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Already have</h2><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">{availableItems.length}</span></div><ul className="grid gap-2">{availableItems.length ? availableItems.map(renderItem) : <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nothing marked as available.</li>}</ul></Card>
						<Card className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Need to get</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900">{missingItems.length}</span></div><ul className="grid gap-2">{missingItems.length ? missingItems.map(renderItem) : <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nothing waiting here.</li>}</ul></Card>
					</section>
				)}
			</div>
		</main>
	);
};

export default PantryPage;
