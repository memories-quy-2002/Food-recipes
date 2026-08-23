import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

export default defineConfig({
	testDir: __dirname,
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: "http://127.0.0.1:4173",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		cwd: path.resolve(__dirname, ".."),
		command: "corepack pnpm run build && corepack pnpm exec vite preview --host 127.0.0.1 --port 4173",
		env: {
			VITE_KONG_BASE_URL: "http://127.0.0.1:8000",
		},
		url: "http://127.0.0.1:4173",
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
