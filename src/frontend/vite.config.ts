import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
	root: __dirname,
	plugins: [react()],
	base: "/",
	resolve: {
		alias: {
			"@": path.resolve(__dirname),
		},
	},
	build: {
		outDir: path.resolve(__dirname, "../../dist"),
		emptyOutDir: true,
	},
});
