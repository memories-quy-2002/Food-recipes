import { Lock, LockOpen, RefreshCw, Shuffle, X } from "lucide-react";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import type { MealPlanPreview, MealPlanPreviewItem } from "./api/planningApi";

type GeneratedPlanPreviewProps = {
	preview: MealPlanPreview;
	onSwap: (item: MealPlanPreviewItem) => void;
	onToggleLock: (item: MealPlanPreviewItem) => void;
	onRegenerate: () => void;
	onSave: () => void;
	onCancel: () => void;
	isRegenerating?: boolean;
	isSaving?: boolean;
	error?: string | null;
};

const formatDate = (date: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
const slotLabel = (slot: string) => slot[0].toUpperCase() + slot.slice(1);

const GeneratedPlanPreview = ({ preview, onSwap, onToggleLock, onRegenerate, onSave, onCancel, isRegenerating = false, isSaving = false, error = null }: GeneratedPlanPreviewProps) => (
	<Card className="mt-5 border-primary/25 bg-primary/[0.03] p-4 sm:p-5" aria-label="Generated meal plan preview">
		<header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Preview only</p>
				<h2 className="mt-1 text-2xl font-black">{preview.name}</h2>
				<p className="mt-1 text-sm text-muted-foreground">{preview.items.length} meals from {formatDate(preview.from)} to {formatDate(preview.to)}. Nothing is saved until you choose Save.</p>
			</div>
			<Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel meal plan preview"><X className="size-5" /></Button>
		</header>

		<div className="mt-4 grid gap-3 sm:grid-cols-2">
			{preview.items.map((item) => (
				<article key={`${item.date}:${item.slot}`} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{formatDate(item.date)} · {slotLabel(item.slot)}</p>
							<h3 className="mt-1 text-lg font-black">{item.recipeName}</h3>
							<p className="text-sm text-muted-foreground">{item.servings} {item.servings === 1 ? "serving" : "servings"}</p>
						</div>
						{item.locked && <span className="rounded-full bg-secondary px-2 py-1 text-xs font-black text-secondary-foreground">Locked</span>}
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button type="button" variant="outline" size="sm" onClick={() => onSwap(item)} disabled={item.locked || isRegenerating || isSaving} aria-label={`Swap ${item.recipeName}`}><Shuffle className="size-4" />Swap</Button>
						<Button type="button" variant="ghost" size="sm" onClick={() => onToggleLock(item)} disabled={isRegenerating || isSaving} aria-label={`${item.locked ? "Unlock" : "Lock"} ${item.recipeName}`}>{item.locked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}{item.locked ? "Unlock" : "Lock"}</Button>
					</div>
				</article>
			))}
		</div>

		{error && <p className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">{error}</p>}
		<footer className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
			<Button type="button" variant="secondary" onClick={onRegenerate} disabled={isRegenerating || isSaving} aria-busy={isRegenerating}><RefreshCw className="size-4" />{isRegenerating ? "Regenerating..." : "Regenerate unlocked meals"}</Button>
			<Button type="button" onClick={onSave} disabled={isSaving || isRegenerating} aria-busy={isSaving}>{isSaving ? "Saving..." : "Save meal plan"}</Button>
		</footer>
	</Card>
);

export default GeneratedPlanPreview;
