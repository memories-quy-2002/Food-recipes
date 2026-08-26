import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import RecipeDescription, { normalizeServings } from "./content/RecipeDescription";

const recipe = {
	recipe_id: 1,
	recipe_description: "A simple recipe.",
	servings: 4,
	ingredients: ["2 cups flour", "1 egg"],
	instructions: ["Mix everything"],
};

const invokeHandler = (handler: unknown): void => {
	if (typeof handler !== "function") throw new Error("Expected a test click handler");
	handler();
};

describe("recipe servings", () => {
	it("clamps valid servings and keeps the selected value visible", () => {
		expect(normalizeServings(undefined)).toBe(4);
		expect(normalizeServings(0)).toBe(1);
		expect(normalizeServings(120)).toBe(99);

		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;

		const decrement = rendered.root.findByProps({ "aria-label": "Decrease servings" });
		const increment = rendered.root.findByProps({ "aria-label": "Increase servings" });
		expect(rendered.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);
		expect(rendered.root.findAllByType("button").some((node: ReactTestInstance) => node.props["aria-label"] === "Decrease servings")).toBe(true);
		expect(rendered.root.findAllByType("button").filter((node: ReactTestInstance) => node.props["aria-label"]).every((node: ReactTestInstance) => node.props.type === "button")).toBe(true);

		act(() => invokeHandler(increment.props.onClick));
		expect(rendered.root.findByProps({ "aria-live": "polite" }).children).toEqual(["5"]);

		act(() => invokeHandler(decrement.props.onClick));
		expect(rendered.root.findByProps({ "aria-live": "polite" }).children).toEqual(["4"]);
	});

	it("resets local servings when the recipe identity changes", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;

		const increment = rendered.root.findByProps({ "aria-label": "Increase servings" });
		act(() => invokeHandler(increment.props.onClick));
		expect(rendered.root.findByProps({ "aria-live": "polite" }).children).toEqual(["5"]);

		act(() => rendered.update(<RecipeDescription recipe={{ ...recipe, recipe_id: 2, servings: 2 }} />));
		expect(rendered.root.findByProps({ "aria-live": "polite" }).children).toEqual(["2"]);
	});

	it("disables and does not change at the serving boundaries", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{ ...recipe, servings: 1 }} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;
		const decrement = renderer.root.findByProps({ "aria-label": "Decrease servings" });
		expect(decrement.props.disabled).toBe(true);
		act(() => invokeHandler(decrement.props.onClick));
		expect(rendered.root.findByProps({ "aria-live": "polite" }).children).toEqual(["1"]);

		act(() => rendered.update(<RecipeDescription recipe={{ ...recipe, recipe_id: 2, servings: 99 }} />));
		const increment = rendered.root.findByProps({ "aria-label": "Increase servings" });
		expect(increment.props.disabled).toBe(true);
		act(() => invokeHandler(increment.props.onClick));
		expect(rendered.root.findByProps({ "aria-live": "polite" }).children).toEqual(["99"]);
	});

	it("does not rewrite free-text ingredient quantities", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={recipe} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;

		const ingredientText = rendered.root.findByProps({ id: "ingredients" }).findAllByType("span").flatMap((node: ReactTestInstance) => node.children);
		expect(ingredientText).toEqual(["2 cups flour", "1 egg"]);
		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain("shown as written");
	});

	it("does not classify unsupported ingredient objects as scalable", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{ ...recipe, ingredients: [{ name: "flour", quantity: 2, unit: "cups" }] }} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;

		const ingredientText = rendered.root.findByProps({ id: "ingredients" }).findAllByType("span").flatMap((node: ReactTestInstance) => node.children);
		expect(ingredientText).toEqual(["2 cups flour"]);
		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain("unsupported");
	});

	it("renders nutrition and dietary metadata when supplied by the API", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{
				...recipe,
				structuredIngredients: [{ quantityText: "1", unit: "cup", name: "flour", preparation: null }],
				nutrition: { servings: 2, calories: 100, protein: 3, carbohydrates: 10, fat: 2, fiber: 1, sugar: 2, sodium: 20 },
				dietaryTags: ["vegetarian"],
				allergenTags: ["wheat"],
			}} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;

		expect(rendered.root.findAllByType("h2").some((node: ReactTestInstance) => node.children.join("") === "Nutrition per serving")).toBe(true);
		expect(rendered.root.findAllByType("span").some((node: ReactTestInstance) => node.children.join("").includes("100 calories"))).toBe(true);
		expect(rendered.root.findAllByType("span").some((node: ReactTestInstance) => node.children.join("") === "vegetarian")).toBe(true);
		expect(rendered.root.findAllByType("p").some((node: ReactTestInstance) => node.children.includes("wheat"))).toBe(true);
	});

	it("scales structured ingredient quantities from the recipe serving baseline", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{
				...recipe,
				structured_ingredients: [{ name: "chicken breast", quantity: 500, unit: "GRAM", note: "diced" }],
			}} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;

		act(() => invokeHandler(rendered.root.findByProps({ "aria-label": "Increase servings" }).props.onClick));
		const ingredientText = rendered.root.findByProps({ id: "ingredients" }).findAllByType("span").flatMap((node: ReactTestInstance) => node.children);
		expect(ingredientText).toEqual(["625 g chicken breast, diced"]);
		expect(renderer.root.findByProps({ role: "note" }).children.join(" ")).toContain("scaled");
	});

	it("renders and scales API-shaped structured ingredients with text units", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(<RecipeDescription recipe={{
				...recipe,
				structured_ingredients: [{
					name: "flour",
					quantity: 1,
					quantity_text: "1",
					unit_text: "cup",
					preparation_text: "sifted",
				}],
			}} />);
		});
		if (!renderer) throw new Error("Expected the recipe description renderer");
		const rendered = renderer;

		const getIngredientText = () => rendered.root.findByProps({ id: "ingredients" }).findAllByType("span").flatMap((node: ReactTestInstance) => node.children);
		expect(getIngredientText()).toEqual(["1 cup flour (sifted)"]);

		act(() => invokeHandler(rendered.root.findByProps({ "aria-label": "Increase servings" }).props.onClick));
		expect(getIngredientText()).toEqual(["1.25 cup flour (sifted)"]);
	});
});
