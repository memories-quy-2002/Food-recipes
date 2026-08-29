import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const viteCli = path.resolve(__dirname, "../node_modules/vite/bin/vite.js");
const e2eBuildDirectory = ".temp/playwright-build";
const previewOutput = process.env.CI ? "" : ` --outDir ${e2eBuildDirectory}`;
const viteCommand = `${JSON.stringify(process.execPath)} ${JSON.stringify(viteCli)}`;
const previewCommand = `${viteCommand} preview${previewOutput} --host 127.0.0.1 --port 4173`;
const buildCommand = `${viteCommand} build --outDir ${e2eBuildDirectory} --emptyOutDir`;

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
		command: process.env.CI ? previewCommand : `${buildCommand} && ${previewCommand}`,
		env: {
			VITE_API_BASE_URL: "http://127.0.0.1:3000",
		},
		url: "http://127.0.0.1:4173",
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
