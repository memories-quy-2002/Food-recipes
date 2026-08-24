import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSuggestionMutation } from "./api/suggestionsQueries";
import "./SuggestionPanel.scss";

const PRIVATE_MODES = new Set(["personalized", "meal_plan"]);

const modeLabels = {
	ingredient_match: "What can I cook?",
	personalized: "Based on my ratings",
	meal_plan: "Fit my meal plan",
	substitution: "Compare an ingredient",
};

const SuggestionPanel = ({
	mode = "ingredient_match",
	recipeId,
	isAuthenticated = false,
	allowPersonalized = false,
}) => {
	const [selectedMode, setSelectedMode] = useState(mode);
	const [ingredientText, setIngredientText] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const mutation = useSuggestionMutation();
	const isPrivateMode = PRIVATE_MODES.has(selectedMode);
	const inputLabel = selectedMode === "substitution" ? "Ingredient to compare" : "Ingredients to search";
	const inputId = useMemo(() => `suggestion-${selectedMode}-input`, [selectedMode]);

	const handleSubmit = (event) => {
		event.preventDefault();
		setErrorMessage("");
		if (isPrivateMode && !isAuthenticated) {
			setErrorMessage("Sign in to use personalized suggestions.");
			return;
		}

		const trimmed = ingredientText.trim();
		const input = selectedMode === "ingredient_match"
			? { intent: selectedMode, ingredients: trimmed.split(",").map((value) => value.trim()).filter(Boolean) }
			: selectedMode === "substitution"
				? { intent: selectedMode, recipeId: Number(recipeId), ingredient: trimmed }
				: { intent: selectedMode };

		mutation.mutate(input, {
			onError: (error) => setErrorMessage(error.response?.data?.message || "Suggestions could not load. Try again."),
		});
	};

	const data = mutation.data;
	return (
		<section className="suggestion-panel" aria-labelledby="suggestion-panel-title">
			<div className="suggestion-panel__header">
				<span>Explore ideas</span>
				<h2 id="suggestion-panel-title">Recipe suggestions</h2>
				<p>Use the existing recipe catalog to find ideas. Nothing is saved or changed automatically.</p>
			</div>
			<form onSubmit={handleSubmit} className="suggestion-panel__form">
				{allowPersonalized && (
					<label>
						Suggestion type
						<select value={selectedMode} onChange={(event) => { setSelectedMode(event.target.value); setIngredientText(""); setErrorMessage(""); }}>
							{Object.entries(modeLabels).filter(([value]) => value !== "substitution" || recipeId).map(([value, label]) => (
								<option key={value} value={value} disabled={PRIVATE_MODES.has(value) && !isAuthenticated}>{label}</option>
							))}
						</select>
					</label>
				)}
				{!isPrivateMode && (
					<label htmlFor={inputId}>
						{inputLabel}
						<input
							id={inputId}
							value={ingredientText}
							onChange={(event) => setIngredientText(event.target.value)}
							placeholder={selectedMode === "substitution" ? "e.g. milk" : "e.g. chicken, onion"}
							maxLength={selectedMode === "substitution" ? 80 : 800}
						/>
					</label>
				)}
				<button type="submit" disabled={mutation.isPending}>
					{mutation.isPending ? "Finding ideas..." : "Find suggestions"}
				</button>
			</form>
			{errorMessage && <p className="suggestion-panel__error" role="alert">{errorMessage}</p>}
			{data && (
				<div className="suggestion-panel__results">
					<p className="suggestion-panel__disclaimer" role="status">{data.disclaimer}</p>
					<p className="suggestion-panel__source">Source: existing catalog data ({data.source}).</p>
					{data.suggestions.length ? (
						<ul>
							{data.suggestions.map((suggestion) => (
								<li key={suggestion.recipe_id}>
									<Link to={`/recipe?id=${suggestion.recipe_id}`}>{suggestion.recipe_name}</Link>
									<span>{suggestion.reason}</span>
								</li>
							))}
						</ul>
					) : <p role="status">No matching recipes were found.</p>}
				</div>
			)}
		</section>
	);
};

export default SuggestionPanel;
