import React, { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import RecipeIngredientChecklist, { getIngredientSignature } from "./RecipeIngredientChecklist";

const DEFAULT_SERVINGS = 4;
const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

const firstDefined = (recipe, fields) => fields.map((field) => recipe?.[field]).find((value) => value !== undefined && value !== null && value !== "");

const toMinutes = (value) => {
	if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
	if (typeof value === "string") {
		const text = value.trim();
		if (!text) return null;
		if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
		const iso = text.match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
		if (iso) return Number(iso[1] || 0) * 1440 + Number(iso[2] || 0) * 60 + Number(iso[3] || 0) + Number(iso[4] || 0) / 60;
		const clock = text.match(/^(?:(\d+)\s+days?\s+)?(\d+):(\d{2})(?::(\d{2}))?$/i);
		if (clock) return Number(clock[1] || 0) * 1440 + Number(clock[2]) * 60 + Number(clock[3]) + Number(clock[4] || 0) / 60;
		return null;
	}
	if (typeof value !== "object") return null;
	const days = Number(value.days ?? value.day ?? value.days_count ?? 0);
	const hours = Number(value.hours ?? value.hour ?? 0);
	const minutes = Number(value.minutes ?? value.minute ?? 0);
	const seconds = Number(value.seconds ?? value.second ?? 0);
	const total = days * 1440 + hours * 60 + minutes + seconds / 60;
	return [days, hours, minutes, seconds].every(Number.isFinite) && total >= 0 ? total : null;
};

export const normalizeRecipeTime = (recipe, kind) => toMinutes(firstDefined(recipe, [`${kind}TimeMinutes`, `${kind}_time_minutes`, `${kind}Time`, `${kind}_time`]));

export const formatRecipeDuration = (minutes) => {
	if (minutes === null || minutes === undefined) return "Not provided";
	const totalMinutes = Math.round(minutes);
	if (totalMinutes < 60) return `${totalMinutes} min`;
	const hours = Math.floor(totalMinutes / 60);
	const remainder = totalMinutes % 60;
	return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

export const getRecipeTimeSummary = (recipe) => {
	const prep = normalizeRecipeTime(recipe, "prep");
	const cook = normalizeRecipeTime(recipe, "cook");
	return { prep, cook, total: prep !== null && cook !== null ? prep + cook : null };
};

const getServings = (recipe) => firstDefined(recipe, ["servings", "serving_count", "yield", "recipe_yield", "recipeYield"]);

const getRecipeIdentity = (recipe) => firstDefined(recipe, ["recipe_id", "id", "publicId"]);

const normalizeInstructions = (instructions) => Array.isArray(instructions)
	? instructions.filter((instruction) => instruction !== null && instruction !== undefined && (typeof instruction !== "string" || instruction.trim().length > 0))
	: [];

export const normalizeServings = (value) => {
	const numericValue = typeof value === "number" ? value : Number.parseFloat(value);
	if (!Number.isFinite(numericValue)) return DEFAULT_SERVINGS;
	return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(numericValue)));
};

const RecipeDescription = ({ recipe }) => {
	const { prep, cook, total } = getRecipeTimeSummary(recipe);
	const instructions = normalizeInstructions(recipe.instructions);
	const [servings, setServings] = useState(() => normalizeServings(getServings(recipe)));
	const recipeIdentity = getRecipeIdentity(recipe);
	useEffect(() => {
		setServings(normalizeServings(getServings(recipe)));
	}, [recipeIdentity]);
	const adjustServings = (amount) => setServings((current) => {
		if ((current === MIN_SERVINGS && amount < 0) || (current === MAX_SERVINGS && amount > 0)) return current;
		return normalizeServings(current + amount);
	});
	return (
		<>
			<Row className="recipe__content__time">
				{[["Prep", prep], ["Cook", cook], ["Total", total]].map(([label, value]) => (
					<Col xs={6} md={3} key={label}><h3>{label}</h3><p>{formatRecipeDuration(value)}</p></Col>
				))}
				<Col xs={6} md={3}>
					<h3>Servings</h3>
					<div className="recipe__content__servings" aria-label="Adjust servings">
						<button type="button" aria-label="Decrease servings" onClick={() => adjustServings(-1)} disabled={servings === MIN_SERVINGS}>−</button>
						<span aria-live="polite">{servings}</span>
						<button type="button" aria-label="Increase servings" onClick={() => adjustServings(1)} disabled={servings === MAX_SERVINGS}>+</button>
					</div>
				</Col>
			</Row>
			<Row className="recipe__content__desc"><div className="recipe__content__prose"><h2>About</h2><p>{recipe.recipe_description ?? "There is no description for this recipe"}</p></div></Row>
			<Row className="recipe__content__ingredient"><div id="ingredients" className="recipe__content__prose"><h2>Ingredients</h2><p role="note">Ingredient quantities are shown as written; automatic scaling is unavailable for free-text or unsupported ingredient data.</p><RecipeIngredientChecklist key={`${recipeIdentity ?? "recipe"}:${getIngredientSignature(recipe.ingredients)}`} recipeIdentity={recipeIdentity} ingredients={recipe.ingredients} /></div></Row>
			<Row className="recipe__content__instruction"><div className="recipe__content__prose"><h2>Instructions</h2>{instructions.length > 0 ? (
				<ol className="recipe__instruction-steps">
					{instructions.map((instruction, index) => (
						<li className="recipe__instruction-step" key={index}>
							<span className="recipe__instruction-step-number" aria-hidden="true">{index + 1}</span>
							<span className="recipe__instruction-step-text">{instruction}</span>
						</li>
					))}
				</ol>
			) : <p className="recipe__instruction-empty" role="status">No information</p>}</div></Row>
		</>
	);
};

export default RecipeDescription;
