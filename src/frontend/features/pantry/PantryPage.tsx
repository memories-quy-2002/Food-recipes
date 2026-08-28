import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Pencil, Search, ShoppingBasket, Trash2, X } from "lucide-react";
import { useHouseholdScope } from "@/features/households/HouseholdScopeProvider";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import { PANTRY_STORAGE_LOCATIONS, PANTRY_UNITS, type PantryExpiryStatus, type PantryItem, type PantryStorageLocation, type PantryUnit } from "./api/pantryApi";
import {
	useCreatePantryItemMutation,
	useDeletePantryItemMutation,
	usePantryQuery,
	useUpdatePantryItemMutation,
} from "./api/pantryQueries";

const unitLabels: Record<string, string> = {
	GRAM: "g",
	KILOGRAM: "kg",
	MILLILITER: "ml",
	LITER: "l",
	TEASPOON: "tsp",
	TABLESPOON: "tbsp",
	CUP: "cup",
	PIECE: "piece",
};

const unitLabel = (value: string | null) => value ? unitLabels[value] ?? value.toLowerCase() : "unit not set";

const storageLabel = (value: string | null | undefined) => value ? value[0].toUpperCase() + value.slice(1) : "Storage not set";

const expiryText = (item: PantryItem): string => {
	if (!item.expires_at || !item.expiry_status || item.expiry_status === "none") return "No expiry date set";
	if (item.expiry_status === "expired") return `Expired · ${item.expires_at}. Check before using.`;
	if (item.expiry_status === "use_soon") return `Use soon · Expires ${item.expires_at}`;
	return `Expires ${item.expires_at}`;
};

const expiryClass: Record<PantryExpiryStatus, string> = {
	none: "text-muted-foreground",
	fresh: "text-emerald-700",
	use_soon: "text-amber-800",
	expired: "text-destructive",
};

const PantryPage = () => {
	const { scope, canEdit, scopeLabel } = useHouseholdScope();
	const pantryQuery = usePantryQuery(scope);
	const createMutation = useCreatePantryItemMutation(scope);
	const updateMutation = useUpdatePantryItemMutation(scope);
	const deleteMutation = useDeletePantryItemMutation(scope);
	const [name, setName] = useState("");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState<PantryUnit>("PIECE");
	const [expiresAt, setExpiresAt] = useState("");
	const [storageLocation, setStorageLocation] = useState<PantryStorageLocation | "">("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editingQuantity, setEditingQuantity] = useState("");
	const [editingUnit, setEditingUnit] = useState<PantryUnit>("PIECE");
	const [editingExpiresAt, setEditingExpiresAt] = useState("");
	const [editingStorageLocation, setEditingStorageLocation] = useState<PantryStorageLocation | "">("");
	const [error, setError] = useState<string | null>(null);
	const items = pantryQuery.data?.items ?? [];
	const availableItems = items.filter((item) => item.have);
	const missingItems = items.filter((item) => !item.have);

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
				...(expiresAt ? { expiresAt } : {}),
				...(storageLocation ? { storageLocation } : {}),
			},
			{
				onSuccess: () => { setName(""); setQuantity(""); setUnit("PIECE"); setExpiresAt(""); setStorageLocation(""); },
				onError: () => setError("We could not add that pantry item. Try again."),
			},
		);
	};

	const startEditing = (item: PantryItem) => {
		if (!canEdit) return;
		setEditingId(item.pantry_id);
		setEditingQuantity(item.quantity === null ? "" : String(item.quantity));
		setEditingUnit(item.unit && PANTRY_UNITS.includes(item.unit as PantryUnit) ? item.unit as PantryUnit : "PIECE");
		setEditingExpiresAt(item.expires_at ?? "");
		setEditingStorageLocation(item.storage_location && PANTRY_STORAGE_LOCATIONS.includes(item.storage_location as PantryStorageLocation) ? item.storage_location as PantryStorageLocation : "");
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
					expiresAt: editingExpiresAt || null,
					storageLocation: editingStorageLocation || null,
				},
			},
			{ onSuccess: () => setEditingId(null) },
		);
	};

	const renderItem = (item: PantryItem) => {
		const itemDetails = (
			<span className="min-w-0 truncate">
				<span className={item.have ? "block truncate font-semibold text-foreground" : "block truncate font-semibold text-muted-foreground line-through"}>{item.name}</span>
				<span className="block text-xs text-muted-foreground">{item.quantity === null ? "Quantity not set" : `${item.quantity} ${unitLabel(item.unit)}`}</span>
				<span className={`block text-xs font-semibold ${expiryClass[item.expiry_status ?? "none"]}`}>{expiryText(item)}</span>
				<span className="block text-xs text-muted-foreground">{storageLabel(item.storage_location)}</span>
			</span>
		);

		return (
			<li key={item.pantry_id} className="rounded-xl border border-border bg-background px-3 py-2">
				<div className="flex min-h-14 items-center justify-between gap-3">
					{canEdit ? (
						<label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								checked={item.have}
								aria-label={`${item.name} available`}
								className="size-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								onChange={() => updateMutation.mutate({ pantryId: item.pantry_id, input: { have: !item.have } })}
							/>
							{itemDetails}
						</label>
					) : (
						<div className="flex min-w-0 flex-1 items-center gap-3">{itemDetails}</div>
					)}
					{canEdit && <div className="flex shrink-0 items-center gap-1">
						<Button variant="ghost" size="icon" onClick={() => editingId === item.pantry_id ? setEditingId(null) : startEditing(item)} aria-label={`${editingId === item.pantry_id ? "Cancel editing" : "Edit"} ${item.name}`}>
							{editingId === item.pantry_id ? <X className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
						</Button>
						<Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(item.pantry_id)} aria-label={`Delete ${item.name}`}>
							<Trash2 className="size-4" aria-hidden="true" />
						</Button>
					</div>}
				</div>
			{item.expiry_status === "use_soon" && <Link className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/food?useSoon=true" aria-label={`Find recipes using ${item.name}`}>Find recipes</Link>}
			{canEdit && editingId === item.pantry_id && <form className="mt-2 grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(event) => saveEditing(event, item)} aria-label={`Edit ${item.name}`}>
				<label className="sr-only" htmlFor={`quantity-${item.pantry_id}`}>Quantity</label>
				<Input id={`quantity-${item.pantry_id}`} type="number" min="0" step="0.001" value={editingQuantity} onChange={(event) => setEditingQuantity(event.target.value)} />
				<label className="sr-only" htmlFor={`unit-${item.pantry_id}`}>Unit</label>
				<select id={`unit-${item.pantry_id}`} className="min-h-12 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20" value={editingUnit} onChange={(event) => setEditingUnit(event.target.value as PantryUnit)}>{PANTRY_UNITS.map((option) => <option key={option} value={option}>{unitLabel(option)}</option>)}</select>
				<label className="sr-only" htmlFor={`expires-${item.pantry_id}`}>Expires on</label>
				<Input id={`expires-${item.pantry_id}`} type="date" value={editingExpiresAt} onChange={(event) => setEditingExpiresAt(event.target.value)} />
				<label className="sr-only" htmlFor={`storage-${item.pantry_id}`}>Storage location</label>
				<select id={`storage-${item.pantry_id}`} className="min-h-12 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20" value={editingStorageLocation} onChange={(event) => setEditingStorageLocation(event.target.value as PantryStorageLocation | "")}><option value="">Storage not set</option>{PANTRY_STORAGE_LOCATIONS.map((option) => <option key={option} value={option}>{storageLabel(option)}</option>)}</select>
				<Button type="submit" size="icon" aria-label={`Save ${item.name}`}><Check className="size-4" aria-hidden="true" /></Button>
			</form>}
			</li>
		);
	};

	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="pantry-title">
			<PageHelmet title="My Pantry" description="Keep a simple list of ingredients you have on hand." path="/pantry" noIndex />
			<div className="mx-auto w-full max-w-6xl">
				<header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div className="max-w-2xl">
						<p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">{scopeLabel}</p>
						<h1 id="pantry-title" className="text-4xl font-black tracking-tight sm:text-5xl">Know what you already have</h1>
						<p className="sr-only">Keep an inventory with quantities so cooking can update what is already in your kitchen.</p>
					</div>
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button asChild variant="outline" className="flex-1"><Link to="/food"><Search className="size-4" aria-hidden="true" />Find recipes</Link></Button><Button asChild variant="outline" className="flex-1"><Link to="/shopping-list"><ShoppingBasket className="size-4" aria-hidden="true" />Shopping list</Link></Button></div>
				</header>

				{canEdit && <Card className="mb-6 p-4 sm:p-5">
					<div className="mb-4"><h2 className="text-xl font-black">Add an ingredient</h2><p className="text-sm text-muted-foreground">Add a quantity and unit so the app can update your stock after cooking.</p></div>
					<form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_8rem_9rem_9rem_10rem_auto] lg:items-end">
						<div className="grid flex-1 gap-2"><label htmlFor="pantry-item" className="text-sm font-bold">Pantry item</label><Input id="pantry-item" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. rice" /></div>
						<div className="grid gap-2 sm:w-32"><label htmlFor="pantry-quantity" className="text-sm font-bold">Quantity</label><Input id="pantry-quantity" type="number" min="0" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="e.g. 2" /></div>
						<div className="grid gap-2 sm:w-36"><label htmlFor="pantry-unit" className="text-sm font-bold">Unit</label><select id="pantry-unit" className="min-h-12 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20" value={unit} onChange={(event) => setUnit(event.target.value as PantryUnit)}>{PANTRY_UNITS.map((option) => <option key={option} value={option}>{unitLabel(option)}</option>)}</select></div>
						<div className="grid gap-2"><label htmlFor="pantry-expires" className="text-sm font-bold">Expires on</label><Input id="pantry-expires" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></div>
						<div className="grid gap-2"><label htmlFor="pantry-storage" className="text-sm font-bold">Storage location</label><select id="pantry-storage" className="min-h-12 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20" value={storageLocation} onChange={(event) => setStorageLocation(event.target.value as PantryStorageLocation | "")}><option value="">Storage not set</option>{PANTRY_STORAGE_LOCATIONS.map((option) => <option key={option} value={option}>{storageLabel(option)}</option>)}</select></div>
						<Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding..." : "Add pantry item"}</Button>
					</form>
					{error && <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">{error}</p>}
				</Card>}

				{pantryQuery.isPending ? (
					<Card className="p-8 text-center" role="status">Loading your pantry...</Card>
				) : pantryQuery.isError ? (
					<Card className="p-6 text-center" role="alert"><h2 className="text-xl font-bold">Pantry could not load</h2><p className="mt-2 text-muted-foreground">We could not fetch your pantry. Try again.</p><Button className="mt-4" onClick={() => pantryQuery.refetch()}>Try again</Button></Card>
				) : items.length === 0 ? (
					<Card className="p-8 text-center"><h2 className="text-xl font-bold">Your pantry is empty</h2><p className="mt-2 text-muted-foreground">Add ingredients you already have so cooking can keep your stock accurate.</p></Card>
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
