/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
	root: __dirname,
	plugins: [react(), tailwindcss()],
	base: "/",
	resolve: {
		alias: {
			"@": path.resolve(__dirname),
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
