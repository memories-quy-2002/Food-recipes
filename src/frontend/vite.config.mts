/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	root: frontendRoot,
	cacheDir: ".vite",
	plugins: [react(), tailwindcss()],
	base: "/",
	resolve: {
		alias: {
			"@": path.resolve(frontendRoot),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	test: {
		exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
	},
});
