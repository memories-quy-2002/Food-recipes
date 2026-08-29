import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, CheckCircle2, PackageCheck, Pencil, Plus, Search, ShoppingBasket, Trash2, X } from "lucide-react";
import { useHouseholdScope } from "@/features/households/HouseholdScopeProvider";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import { PANTRY_UNITS, type PantryItem, type PantryUnit } from "./api/pantryApi";
import {
	useCreatePantryItemMutation,
	useDeletePantryItemMutation,
	usePantryQuery,
	useUpdatePantryItemMutation,
} from "./api/pantryQueries";

type PantryFilter = "all" | "available" | "missing";

const unitLabels: Record<string, string> = {
	GRAM: "g",
	KILOGRAM: "kg",
	MILLILITER: "ml",
	LITER: "l",
	TEASPOON: "tsp",
	TABLESPOON: "tbsp",
	CUP: "cup",
	PIECE: "pc",
};

const unitLabel = (value: string | null) => value ? unitLabels[value] ?? value.toLowerCase() : "unit not set";

const selectClass = "min-h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20";

const PantryPage = () => {
	const { scope, canEdit, scopeLabel } = useHouseholdScope();
	const pantryQuery = usePantryQuery(scope);
	const createMutation = useCreatePantryItemMutation(scope);
	const updateMutation = useUpdatePantryItemMutation(scope);
	const deleteMutation = useDeletePantryItemMutation(scope);
	const [name, setName] = useState("");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState<PantryUnit>("PIECE");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editingQuantity, setEditingQuantity] = useState("");
	const [editingUnit, setEditingUnit] = useState<PantryUnit>("PIECE");
	const [filter, setFilter] = useState<PantryFilter>("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const items = pantryQuery.data?.items ?? [];
	const availableItems = items.filter((item) => item.have);
	const missingItems = items.filter((item) => !item.have);
	const normalizedSearch = searchTerm.trim().toLowerCase();
	const filteredItems = items.filter((item) => {
		const matchesSearch = !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch);
		const matchesFilter = filter === "all"
			|| (filter === "available" && item.have)
			|| (filter === "missing" && !item.have);
		return matchesSearch && matchesFilter;
	});
	const filteredAvailableItems = filteredItems.filter((item) => item.have);
	const filteredMissingItems = filteredItems.filter((item) => !item.have);

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canEdit) return;
		const nextName = name.trim();
		const nextQuantity = Number(quantity);
		if (!nextName) {
			setError("Add an item name before saving.");
			return;
		}
		if (!quantity.trim() || !Number.isFinite(nextQuantity) || nextQuantity < 0) {
			setError("Add a valid quantity before saving.");
			return;
		}
		setError(null);
		createMutation.mutate(
			{
				name: nextName,
				quantity: nextQuantity,
				unit,
				have: true,
			},
			{
				onSuccess: () => { setName(""); setQuantity(""); setUnit("PIECE"); },
				onError: () => setError("We could not add that pantry item. Try again."),
			},
		);
	};

	const startEditing = (item: PantryItem) => {
		if (!canEdit) return;
		setEditingId(item.pantry_id);
		setEditingQuantity(item.quantity === null ? "" : String(item.quantity));
		setEditingUnit(item.unit && PANTRY_UNITS.includes(item.unit as PantryUnit) ? item.unit as PantryUnit : "PIECE");
		setError(null);
	};

	const saveEditing = (event: FormEvent<HTMLFormElement>, item: PantryItem) => {
		event.preventDefault();
		if (!canEdit) return;
		const nextQuantity = Number(editingQuantity);
		if (!editingQuantity.trim() || !Number.isFinite(nextQuantity) || nextQuantity < 0) {
			setError("Add a valid quantity before saving.");
			return;
		}
		setError(null);
		updateMutation.mutate(
			{
				pantryId: item.pantry_id,
				input: {
					quantity: nextQuantity,
					unit: editingUnit,
				},
			},
			{ onSuccess: () => setEditingId(null) },
		);
	};

	const renderItem = (item: PantryItem) => {
		const itemDetails = (
			<span className="min-w-0 flex-1">
				<span className={item.have ? "block truncate font-bold text-foreground" : "block truncate font-bold text-muted-foreground line-through"}>{item.name}</span>
				<span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
					<span className="font-semibold text-foreground">{item.quantity === null ? "Quantity not set" : `${item.quantity} ${unitLabel(item.unit)}`}</span>
				</span>
			</span>
		);

		return (
			<li key={item.pantry_id} className="group border-b border-border/60 py-4 first:pt-1 last:border-b-0 last:pb-1">
				<div className="flex min-h-14 items-center gap-3">
					{canEdit ? (
						<label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								checked={item.have}
								aria-label={`${item.name} available`}
								className="size-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								onChange={() => updateMutation.mutate({ pantryId: item.pantry_id, input: { have: !item.have } })}
							/>
							<span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.have ? "bg-secondary/70 text-foreground" : "bg-muted text-muted-foreground"}`} aria-hidden="true">
								{item.have ? <PackageCheck className="size-5" /> : <AlertTriangle className="size-5" />}
							</span>
							{itemDetails}
						</label>
					) : (
						<div className="flex min-w-0 flex-1 items-center gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.have ? "bg-secondary/70 text-foreground" : "bg-muted text-muted-foreground"}`} aria-hidden="true">{item.have ? <PackageCheck className="size-5" /> : <AlertTriangle className="size-5" />}</span>{itemDetails}</div>
					)}
					{canEdit && <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-70 sm:group-hover:opacity-100">
						<Button variant="ghost" size="icon" onClick={() => editingId === item.pantry_id ? setEditingId(null) : startEditing(item)} aria-label={`${editingId === item.pantry_id ? "Cancel editing" : "Edit"} ${item.name}`}>
							{editingId === item.pantry_id ? <X className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
						</Button>
						<Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(item.pantry_id)} aria-label={`Delete ${item.name}`}>
							<Trash2 className="size-4" aria-hidden="true" />
						</Button>
					</div>}
				</div>
				{canEdit && editingId === item.pantry_id && <form className="ml-8 mt-3 grid gap-2 border-t border-border/60 pt-3 sm:ml-20 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => saveEditing(event, item)} aria-label={`Edit ${item.name}`}>
					<label className="sr-only" htmlFor={`quantity-${item.pantry_id}`}>Quantity</label>
					<Input id={`quantity-${item.pantry_id}`} type="number" min="0" step="0.001" value={editingQuantity} onChange={(event) => setEditingQuantity(event.target.value)} />
					<label className="sr-only" htmlFor={`unit-${item.pantry_id}`}>Unit</label>
					<select id={`unit-${item.pantry_id}`} className={selectClass} value={editingUnit} onChange={(event) => setEditingUnit(event.target.value as PantryUnit)}>{PANTRY_UNITS.map((option) => <option key={option} value={option}>{unitLabel(option)}</option>)}</select>
					<Button type="submit" size="icon" aria-label={`Save ${item.name}`}><Check className="size-4" aria-hidden="true" /></Button>
				</form>}
			</li>
		);
	};

	const renderList = (list: PantryItem[], emptyMessage: string) => list.length
		? <ul>{list.map(renderItem)}</ul>
		: <div className="rounded-2xl border border-dashed border-border/80 bg-muted/35 px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>;

	return (
		<main className="min-h-screen bg-background px-4 py-7 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="pantry-title">
			<PageHelmet title="My Pantry" description="Keep a simple list of ingredients you have on hand." path="/pantry" noIndex />
			<div className="mx-auto w-full max-w-7xl">
				<header className="mb-8 flex flex-col gap-5 border-b border-border/70 pb-7 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-2xl">
						<p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary"><PackageCheck className="size-4" aria-hidden="true" />{scopeLabel}</p>
						<h1 id="pantry-title" className="text-4xl font-black tracking-tight sm:text-5xl">Pantry</h1>
						<p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">A clear view of what is ready to cook and what needs restocking.</p>
					</div>
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Button asChild variant="outline" size="sm" className="flex-1"><Link to="/food"><Search className="size-4" aria-hidden="true" />Find recipes</Link></Button>
						<Button asChild variant="outline" size="sm" className="flex-1"><Link to="/shopping-list"><ShoppingBasket className="size-4" aria-hidden="true" />Shopping list</Link></Button>
					</div>
				</header>

				<section className="mb-6 grid max-w-3xl gap-3 sm:grid-cols-2" aria-label="Pantry overview">
					<div className="rounded-2xl bg-secondary/55 px-5 py-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground"><CheckCircle2 className="size-4" aria-hidden="true" />On hand</div><p className="mt-2 text-3xl font-black text-foreground">{availableItems.length}</p><p className="text-sm text-muted-foreground">ready to use</p></div>
					<div className="rounded-2xl bg-muted px-5 py-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground"><AlertTriangle className="size-4" aria-hidden="true" />Need to buy</div><p className="mt-2 text-3xl font-black text-foreground">{missingItems.length}</p><p className="text-sm text-muted-foreground">out of stock</p></div>
				</section>

				{canEdit && <Card className="mb-6 overflow-hidden p-0">
					<div className="border-b border-border/60 bg-muted/35 px-5 py-4 sm:px-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Plus className="size-5" aria-hidden="true" /></span><div><h2 className="text-xl font-black">Add an ingredient</h2><p className="mt-1 text-sm text-muted-foreground">Include a quantity and unit so cooking can subtract the right amount automatically.</p></div></div></div>
					<form onSubmit={submit} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,2fr)_minmax(8rem,0.7fr)_minmax(9rem,0.8fr)_auto] sm:items-end sm:p-6 lg:gap-4">
						<div className="grid gap-2"><label htmlFor="pantry-item" className="text-sm font-bold">Pantry item</label><Input id="pantry-item" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. rice" /></div>
						<div className="grid gap-2"><label htmlFor="pantry-quantity" className="text-sm font-bold">Quantity</label><Input id="pantry-quantity" type="number" min="0" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="e.g. 2" /></div>
						<div className="grid gap-2"><label htmlFor="pantry-unit" className="text-sm font-bold">Unit</label><select id="pantry-unit" className={selectClass} value={unit} onChange={(event) => setUnit(event.target.value as PantryUnit)}>{PANTRY_UNITS.map((option) => <option key={option} value={option}>{unitLabel(option)}</option>)}</select></div>
						<Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding..." : <><Plus className="size-4" aria-hidden="true" />Add pantry item</>}</Button>
					</form>
					{error && <p className="mx-5 mb-5 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive sm:mx-6" role="alert">{error}</p>}
				</Card>}

				{pantryQuery.isPending ? (
					<Card className="p-10 text-center" role="status"><PackageCheck className="mx-auto size-8 animate-pulse text-primary" aria-hidden="true" /><p className="mt-3 font-semibold">Loading your pantry...</p></Card>
				) : pantryQuery.isError ? (
					<Card className="p-8 text-center" role="alert"><h2 className="text-xl font-bold">Pantry could not load</h2><p className="mt-2 text-muted-foreground">We could not fetch your pantry. Try again.</p><Button className="mt-4" onClick={() => pantryQuery.refetch()}>Try again</Button></Card>
				) : items.length === 0 ? (
					<Card className="p-10 text-center"><PackageCheck className="mx-auto size-10 text-muted-foreground" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold">Your pantry is empty</h2><p className="mx-auto mt-2 max-w-md text-muted-foreground">Add ingredients you already have so cooking can keep your stock accurate.</p></Card>
				) : (
					<section aria-label="Pantry ingredients">
						<div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
							<div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><label className="sr-only" htmlFor="pantry-search">Search pantry</label><Input id="pantry-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search ingredients" className="pl-10" /></div>
							<div className="flex shrink-0 items-center gap-2"><label className="sr-only" htmlFor="pantry-filter">Filter pantry</label><select id="pantry-filter" className={`${selectClass} sm:w-44`} value={filter} onChange={(event) => setFilter(event.target.value as PantryFilter)}><option value="all">All items</option><option value="available">On hand</option><option value="missing">Need to buy</option></select><span className="hidden rounded-full bg-muted px-3 py-2 text-xs font-bold text-muted-foreground sm:inline-flex" aria-live="polite">{filteredItems.length} items</span></div>
						</div>
						<div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
							<Card className="p-5 sm:p-6"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Ready now</p><h2 className="mt-1 text-2xl font-black">On hand</h2></div><span className="text-sm font-bold text-muted-foreground">{filteredAvailableItems.length} / {availableItems.length}</span></div>{renderList(filteredAvailableItems, filter === "all" ? "Nothing marked as available." : "No available items match this filter.")}</Card>
							<Card className="p-5 sm:p-6"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Restock</p><h2 className="mt-1 text-2xl font-black">Need to buy</h2></div><span className="text-sm font-bold text-muted-foreground">{filteredMissingItems.length} / {missingItems.length}</span></div>{renderList(filteredMissingItems, filter === "all" ? "Nothing waiting here." : "No items need restocking for this filter.")}</Card>
						</div>
					</section>
				)}
			</div>
		</main>
	);
};

export default PantryPage;
