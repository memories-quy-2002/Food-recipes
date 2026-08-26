import TestRenderer, {
	act,
	type ReactTestInstance,
	type ReactTestRenderer,
} from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Account from "./Account";

vi.mock("./components/AccountForm", () => ({
	default: () => <div>Account form</div>,
}));

vi.mock("@/shared/seo/PageHelmet", () => ({
	default: () => null,
}));

describe("Account surface", () => {
	it("does not use Tailwind's blur utility class for the auth form", () => {
		let renderer: ReactTestRenderer | undefined;
		act(() => {
			renderer = TestRenderer.create(
				<MemoryRouter initialEntries={["/account?login=true"]}>
					<Account />
				</MemoryRouter>,
			);
		});

		if (!renderer) throw new Error("Expected the account surface renderer");
		expect(renderer.root.findByType("main")).toBeTruthy();
		expect(
			renderer.root.findAll(
				(node: ReactTestInstance) =>
					typeof node.props?.className === "string" &&
					node.props.className.split(" ").includes("blur"),
			),
		).toHaveLength(0);
	});
});
