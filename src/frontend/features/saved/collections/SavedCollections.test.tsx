// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SavedCollections from "./SavedCollections";

const collections: Array<{ collection_id: number; name: string; recipe_count: number }> = [{ collection_id: 4, name: "Weeknight dinners", recipe_count: 2 }];

describe("SavedCollections", () => {
	afterEach(cleanup);
	it("keeps All saved as the default and selects a private collection", () => {
		const onSelect = vi.fn();
		render(
			<SavedCollections
				collections={collections}
				selectedCollectionId={null}
				onSelect={onSelect}
				onCreate={vi.fn()}
				onRename={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		expect(screen.getByRole("tab", { name: "All saved" })).toHaveAttribute("aria-selected", "true");
		fireEvent.click(screen.getByRole("tab", { name: /Weeknight dinners/ }));
		expect(onSelect).toHaveBeenCalledWith(4);
	});

	it("exposes a create collection action", () => {
		const onCreate = vi.fn();
		render(<SavedCollections collections={[]} selectedCollectionId={null} onSelect={vi.fn()} onCreate={onCreate} onRename={vi.fn()} onDelete={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
		expect(onCreate).toHaveBeenCalledOnce();
	});
});
