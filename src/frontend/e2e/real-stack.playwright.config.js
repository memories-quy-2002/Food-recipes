import { defineConfig, devices } from "@playwright/test";

const webBaseURL = process.env.FOOD_RECIPES_E2E_WEB_URL || "http://localhost:5173";
const skipAcceptanceAndSecurity = process.env.FOOD_RECIPES_E2E_SKIP_ACCEPTANCE_SECURITY === "1";
const ignoredRealStackSuites = skipAcceptanceAndSecurity
	? ["real-stack/acceptance.spec.js", "real-stack/security.spec.js"]
	: [];

export default defineConfig({
	testDir: __dirname,
	testMatch: ["real-stack/**/*.spec.js", "real-backend-inventory.spec.js", "live-kitchen-loop.spec.js"],
	testIgnore: ignoredRealStackSuites,
	fullyParallel: false,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: webBaseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
