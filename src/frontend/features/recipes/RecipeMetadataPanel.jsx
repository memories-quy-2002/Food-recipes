import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

const SOURCE_LABELS = {
	provided_by_author: "Provided by recipe author",
	estimated: "Estimated",
	verified_external: "Verified external data",
};

const ALLERGEN_LABELS = {
	milk: "Milk",
	eggs: "Eggs",
	peanuts: "Peanuts",
	tree_nuts: "Tree nuts",
	soy: "Soy",
	wheat: "Wheat",
	fish: "Fish",
	shellfish: "Shellfish",
	sesame: "Sesame",
};

const nutritionFields = [
	["protein_grams", "Protein", "g"],
	["carbohydrates_grams", "Carbohydrates", "g"],
	["fat_grams", "Fat", "g"],
	["fiber_grams", "Fiber", "g"],
	["sugar_grams", "Sugar", "g"],
	["sodium_milligrams", "Sodium", "mg"],
];

const sourceLabel = (source) => SOURCE_LABELS[source] || "Source not specified";

const WarningNote = ({ children }) => (
	<p className="mt-4 flex gap-2 rounded-xl border border-accent/50 bg-accent/20 px-4 py-3 text-sm leading-6 text-foreground" role="note">
		<AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
		<span>{children}</span>
	</p>
);

const RecipeMetadataPanel = ({ metadata }) => {
	const nutrition = metadata?.nutrition ?? null;
	const allergens = Array.isArray(metadata?.allergens) ? metadata.allergens : [];
	const hasMetadata = Boolean(nutrition || allergens.length);

	return (
		<section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:p-8" aria-labelledby="recipe-metadata-title">
			<div className="flex items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
					<ShieldAlert className="size-5" aria-hidden="true" />
				</div>
				<div>
					<h2 id="recipe-metadata-title" className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Nutrition and allergens</h2>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Use this information as practical guidance, not medical advice. Always verify ingredient labels for allergies.</p>
				</div>
			</div>

			{!hasMetadata ? (
				<div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-sm leading-6 text-muted-foreground">
					<p>No nutrition or allergen metadata has been provided for this recipe.</p>
					<p className="mt-1 font-semibold text-foreground">This does not guarantee that the recipe is allergen-free.</p>
				</div>
			) : (
				<div className="mt-6 grid gap-6">
					{nutrition ? (
						<div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
							<div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
								<strong className="text-xl font-black text-foreground">{nutrition.calories_per_serving} kcal <span className="text-sm font-semibold text-muted-foreground">per serving</span></strong>
								<span className="text-xs font-bold text-muted-foreground">{sourceLabel(nutrition.source)}</span>
							</div>
							<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
								{nutritionFields.map(([field, label, unit]) => nutrition[field] !== null && nutrition[field] !== undefined ? (
									<div key={field} className="rounded-xl bg-muted px-3 py-3">
										<span className="block text-xs font-bold text-muted-foreground">{label}</span>
										<strong className="mt-1 block text-sm font-black text-foreground">{nutrition[field]} {unit}</strong>
									</div>
								) : null)}
							</div>
							{nutrition.source_reference ? <p className="mt-4 break-words text-xs leading-5 text-muted-foreground">Reference: {nutrition.source_reference}</p> : null}
							{nutrition.source === "estimated" ? <WarningNote>Estimated nutrition is for general guidance only and is not medically authoritative.</WarningNote> : null}
						</div>
					) : null}

					<div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
						<h3 className="text-lg font-black text-foreground">Declared allergens</h3>
						{allergens.length ? (
							<ul className="mt-4 space-y-2">
								{allergens.map((allergen) => (
									<li key={`${allergen.name}-${allergen.source}`} className="flex flex-col gap-1 rounded-xl bg-muted px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
										<strong className="text-sm font-black text-foreground">{ALLERGEN_LABELS[allergen.name] || allergen.name}</strong>
										<span className="text-xs font-semibold text-muted-foreground">{sourceLabel(allergen.source)}</span>
									</li>
								))}
							</ul>
						) : <p className="mt-4 text-sm leading-6 text-muted-foreground">No allergens are declared. This is not a guarantee that the recipe is allergen-free.</p>}
						{allergens.some((allergen) => allergen.source === "estimated") ? <WarningNote>Estimated allergen information is only guidance. Verify every ingredient label before cooking.</WarningNote> : null}
					</div>
				</div>
			)}
		</section>
	);
};

export default RecipeMetadataPanel;
