import { defineConfig, devices } from "@playwright/test";

const webBaseURL = process.env.FOOD_RECIPES_E2E_WEB_URL || "http://localhost:5173";

export default defineConfig({
	testDir: __dirname,
	testMatch: ["real-stack/**/*.spec.js", "real-backend-inventory.spec.js", "live-kitchen-loop.spec.js"],
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
