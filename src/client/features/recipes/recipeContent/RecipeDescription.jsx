import React from "react";
import { Row, Col } from "react-bootstrap";

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

const RecipeDescription = ({ recipe }) => {
	const { prep, cook, total } = getRecipeTimeSummary(recipe);
	const servings = getServings(recipe);
	return (
		<>
			<Row className="recipe__content__desc"><div><h2>About</h2><p>{recipe.recipe_description ?? "There is no description for this recipe"}</p></div></Row>
			<Row className="recipe__content__time">
				{[["Prep", prep], ["Cook", cook], ["Total", total], ["Servings", servings]].map(([label, value]) => (
					<Col xs={6} md={3} key={label}><h3>{label}</h3><p>{label === "Servings" ? value || "Not provided" : formatRecipeDuration(value)}</p></Col>
				))}
			</Row>
			<Row className="recipe__content__ingredient"><div id="ingredients"><h2>Ingredients</h2><ul>{recipe.ingredients ? recipe.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>) : "No information"}</ul></div></Row>
			<Row className="recipe__content__instruction"><div><h2>Instructions</h2><ol>{recipe.instructions ? recipe.instructions.map((instruction, index) => <li key={index}>{instruction}</li>) : "No information"}</ol></div></Row>
		</>
	);
};

export default RecipeDescription;
