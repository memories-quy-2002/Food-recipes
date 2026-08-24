import React from "react";
import "./RecipeMetadataPanel.scss";

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

const RecipeMetadataPanel = ({ metadata }) => {
	const nutrition = metadata?.nutrition ?? null;
	const allergens = Array.isArray(metadata?.allergens) ? metadata.allergens : [];
	const hasMetadata = Boolean(nutrition || allergens.length);

	return (
		<section className="recipe-metadata-panel" aria-labelledby="recipe-metadata-title">
			<h2 id="recipe-metadata-title">Nutrition and allergens</h2>
			{!hasMetadata ? (
				<div className="recipe-metadata-panel__empty">
					<p>No nutrition or allergen metadata has been provided for this recipe.</p>
					<p>This is not a guarantee that the recipe is allergen-free.</p>
				</div>
			) : (
				<>
					{nutrition && (
						<div className="recipe-metadata-panel__nutrition">
							<div className="recipe-metadata-panel__calories">
								<strong>{nutrition.calories_per_serving} kcal per serving</strong>
								<span>{sourceLabel(nutrition.source)}</span>
							</div>
							<div className="recipe-metadata-panel__grid">
								{nutritionFields.map(([field, label, unit]) => (
									nutrition[field] !== null && nutrition[field] !== undefined && (
										<div key={field}>
											<span>{label}</span>
											<strong>{nutrition[field]} {unit}</strong>
										</div>
									)
								))}
							</div>
							{nutrition.source_reference && <p className="recipe-metadata-panel__source">Reference: {nutrition.source_reference}</p>}
							{nutrition.source === "estimated" && (
								<p className="recipe-metadata-panel__warning" role="note">
									Estimated information is for general guidance only and is not medically authoritative.
								</p>
							)}
						</div>
					)}
					<div className="recipe-metadata-panel__allergens">
						<h3>Declared allergens</h3>
						{allergens.length ? (
							<ul>
								{allergens.map((allergen) => (
									<li key={`${allergen.name}-${allergen.source}`}>
										<strong>{ALLERGEN_LABELS[allergen.name] || allergen.name}</strong>
										<span>{sourceLabel(allergen.source)}</span>
									</li>
								))}
							</ul>
						) : <p>This is not a guarantee that the recipe is allergen-free.</p>}
						{allergens.some((allergen) => allergen.source === "estimated") && (
							<p className="recipe-metadata-panel__warning" role="note">
								Estimated allergen information is for general guidance only. Verify the ingredient label before cooking.
							</p>
						)}
					</div>
				</>
			)}
		</section>
	);
};

export default RecipeMetadataPanel;
