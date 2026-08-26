import TestRenderer, { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HomeSearchBar from "./HomeSearchBar";

const recipes = [
	{ recipe_id: 1, recipe_name: "Full collection result" },
	{ recipe_id: 2, recipe_name: "Another full collection result" },
];

const serverSearchResults = [
	{ recipe_id: 9, recipe_name: "Chicken Curry", image_url: null },
];

describe("HomeSearchBar server-backed results", () => {
	it("renders only server suggestions and links to the complete filtered page", () => {
		let renderer!: ReactTestRenderer;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter initialEntries={["/?q=chick"]}>
					<HomeSearchBar recipes={recipes} searchResults={serverSearchResults} isSearchLoading={false} />
				</MemoryRouter>,
			);
		});

		expect(renderer.root.findAllByProps({ role: "option" })).toHaveLength(1);
		expect(
			renderer.root.findAllByType("p").some((node: ReactTestInstance) => node.children.includes("Chicken Curry")),
		).toBe(true);
		const links = renderer.root.findAllByType("a");
		expect(links.some((link) => link.props.href === "/food?q=chick")).toBe(true);
	});
});
