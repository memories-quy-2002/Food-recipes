import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";

vi.mock("react-redux", () => ({
	useSelector: () => ({
		local: { isAuthenticated: false, user: null },
		session: { isAuthenticated: false, user: null },
	}),
}));

vi.mock("./HeaderBrand", () => ({ default: () => <span>Food recipes</span> }));
vi.mock("./HeaderMenu", () => ({ default: () => <nav>Primary navigation</nav> }));
vi.mock("./HeaderAuthButton", () => ({ default: () => <button>Sign in</button> }));
vi.mock("./HeaderToggle", () => ({ default: () => <button>Open navigation menu</button> }));
vi.mock("@/features/households/HouseholdScopeSelector", () => ({
	default: () => <select aria-label="Kitchen scope" />,
}));
vi.mock("@/features/notifications/NotificationCenter", () => ({
	default: () => <button>Notifications</button>,
}));

const renderHeader = (): ReactTestRenderer => {
	let renderer: ReactTestRenderer | undefined;
	act(() => {
		renderer = TestRenderer.create(
			<MemoryRouter>
				<Header />
			</MemoryRouter>,
		);
	});
	if (!renderer) throw new Error("The header renderer was not created.");
	return renderer;
};

describe("Header layout", () => {
	it("uses the same wide content container as the Home page sections", () => {
		const renderer = renderHeader();
		const shell = renderer.root.findAll(
			(node) =>
				node.type === "div" &&
				typeof node.props.className === "string" &&
				node.props.className.includes("max-w-"),
		)[0];

		expect(shell.props.className).toContain("max-w-[112rem]");
	});
});
