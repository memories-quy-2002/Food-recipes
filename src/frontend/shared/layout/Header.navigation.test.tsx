import React from "react";
import TestRenderer, {
	act,
	type ReactTestInstance,
	type ReactTestRenderer,
} from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HeaderMenu from "./HeaderMenu";
import HeaderToggle from "./HeaderToggle";
import { AuthContext } from "@/app/AuthProvider";
import { getPrimaryNavigation } from "./navigation";

vi.mock("react-redux", () => ({
	useDispatch: () => vi.fn(),
}));

vi.mock("@/app/AuthProvider", () => ({
	AuthContext: React.createContext({}),
}));

vi.mock("@/features/auth/state/authSlice", () => ({
	authActions: { logout: () => ({ type: "auth/logout" }) },
}));

vi.mock("react-bootstrap", () => {
	const passthrough = ({
		children,
		...props
	}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
		<div {...props}>{children}</div>
	);
	const Button = ({
		children,
		...props
	}: React.PropsWithChildren<
		React.ButtonHTMLAttributes<HTMLButtonElement>
	>) => <button {...props}>{children}</button>;

	return {
		Button,
		Offcanvas: Object.assign(passthrough, {
			Body: passthrough,
			Header: passthrough,
			Title: passthrough,
		}),
	};
});

const renderTree = (
	ui: React.ReactElement,
	initialEntry = "/",
): ReactTestRenderer => {
	let renderer: ReactTestRenderer | undefined;
	act(() => {
		renderer = TestRenderer.create(
			<MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
		);
	});
	if (!renderer) throw new Error("The navigation renderer was not created.");
	return renderer;
};

const findTextNode = (
	renderer: ReactTestRenderer,
	type: string,
	name: string,
): ReactTestInstance => {
	const node = renderer.root.findAll(
		(node) =>
			node.type === type &&
			node.children?.some((child) => child === name),
	)[0];
	if (!node) throw new Error(`Could not find ${type} containing ${name}.`);
	return node;
};

const findLink = (renderer: ReactTestRenderer, name: string): ReactTestInstance =>
	findTextNode(renderer, "a", name);
const findButton = (
	renderer: ReactTestRenderer,
	name: string,
): ReactTestInstance => findTextNode(renderer, "button", name);
const findOptionalLink = (
	renderer: ReactTestRenderer,
	name: string,
): ReactTestInstance | undefined =>
	renderer.root.findAll(
		(node) =>
			node.type === "a" &&
			node.children?.some((child) => child === name),
	)[0];
const findNodeByProp = (
	renderer: ReactTestRenderer,
	type: string,
	prop: string,
	value: unknown,
): ReactTestInstance => {
	const node = renderer.root.findAll(
		(node) => node.type === type && node.props[prop] === value,
	)[0];
	if (!node) throw new Error(`Could not find ${type} with ${prop}=${String(value)}.`);
	return node;
};

const invokeCallback = (callback: unknown, ...args: unknown[]): void => {
	if (typeof callback !== "function") {
		throw new Error("Expected a callback prop.");
	}
	callback(...args);
};

const renderMobile = (isAuthenticated: boolean, initialEntry = "/") => {
	const handleClose = vi.fn();
	const items = getPrimaryNavigation(isAuthenticated, false);

	const renderer = renderTree(
		<AuthContext.Provider
			value={{
				auth: {
					current: {
						isAuthenticated,
						user: isAuthenticated ? { full_name: "Recipe Author" } : null,
					},
				},
			}}
		>
			<HeaderToggle
				show
				handleClose={handleClose}
				handleShow={vi.fn()}
				items={items}
			/>
		</AuthContext.Provider>,
		initialEntry
	);

	return { handleClose, renderer };
};

describe("primary navigation", () => {
	it("uses user-facing recipe labels and keeps compatible routes", () => {
		expect(getPrimaryNavigation(false, true)).toEqual([
			{ title: "Home", href: "/" },
			{ title: "Recipes", href: "/food" },
			{ title: "Saved", href: "/wishlist" },
			{ title: "Health", href: "/health" },
		]);
	});

	it("shows Add Recipe only for authenticated users", () => {
		expect(getPrimaryNavigation(true)).toContainEqual({
			 title: "Add Recipe",
			href: "/food/add",
		});
			expect(getPrimaryNavigation(true)).toContainEqual({
				title: "Planning",
				href: "/planning",
			});
			expect(getPrimaryNavigation(true)).toContainEqual({
				title: "Shopping",
				href: "/shopping-list",
			});
		expect(getPrimaryNavigation(false)).not.toContainEqual({
			title: "Add Recipe",
			href: "/food/add",
		});
		expect(getPrimaryNavigation(false)).not.toContainEqual({
			title: "Planning",
			href: "/planning",
		});
		expect(getPrimaryNavigation(false)).not.toContainEqual({
			title: "Shopping",
			href: "/shopping-list",
		});
	});

	it("renders desktop navigation items as links and activates only Add Recipe on /food/add", () => {
		const renderer = renderTree(
			<HeaderMenu items={getPrimaryNavigation(true, false)} />,
			"/food/add"
		);

		expect(findLink(renderer, "Recipes").props.href).toBe("/food");
		expect(findLink(renderer, "Add Recipe").props["aria-current"]).toBe("page");
		expect(findLink(renderer, "Recipes").props["aria-current"]).toBeUndefined();
	});

	it("keeps Recipes active for a nested recipe route", () => {
		const renderer = renderTree(
			<HeaderMenu items={getPrimaryNavigation(true, false)} />,
			"/food/recipe-123"
		);

		expect(findLink(renderer, "Recipes").props["aria-current"]).toBe("page");
		expect(findLink(renderer, "Add Recipe").props["aria-current"]).toBeUndefined();
	});

	it("renders mobile primary navigation as links and closes after activation", () => {
		const { handleClose, renderer } = renderMobile(true, "/");

		const addRecipe = findLink(renderer, "Add Recipe");
		expect(addRecipe.props.href).toBe("/food/add");
		expect(addRecipe.props.tabIndex).toBeUndefined();
		act(() =>
			invokeCallback(addRecipe.props.onClick, {
				button: 0,
				defaultPrevented: false,
				metaKey: false,
				altKey: false,
				ctrlKey: false,
				shiftKey: false,
				preventDefault: vi.fn(),
			}),
		);
		expect(handleClose).toHaveBeenCalledOnce();
	});

	it("shows mobile auth labels and marks Add Recipe active on /food/add", () => {
		const authenticated = renderMobile(true, "/food/add");
		expect(findLink(authenticated.renderer, "Add Recipe").props["aria-current"]).toBe("page");
		expect(findButton(authenticated.renderer, "Sign out")).toBeDefined();

		authenticated.renderer.unmount();
		const unauthenticated = renderMobile(false);
		expect(findButton(unauthenticated.renderer, "Login / Sign up")).toBeDefined();
		expect(findOptionalLink(unauthenticated.renderer, "Add Recipe")).toBeUndefined();
	});

	it("exposes expanded state on the mobile menu toggle", () => {
		const { renderer } = renderMobile(false);
		expect(
			findNodeByProp(renderer, "button", "aria-label", "Open navigation menu")
				.props["aria-expanded"]
		).toBe(true);
	});
});
