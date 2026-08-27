import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./Food";

describe("getApiErrorMessage", () => {
	it("does not create an error message when the request succeeded", () => {
		expect(getApiErrorMessage(undefined, "Unable to load recipes.")).toBeNull();
		expect(getApiErrorMessage(null, "Unable to load recipes.")).toBeNull();
	});

	it("keeps a useful message when a request actually fails", () => {
		expect(getApiErrorMessage(new Error("Request failed"), "Fallback")).toBe("Request failed");
	});
});
