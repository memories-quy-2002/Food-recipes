import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const frontendFiles = ["**/*.{js,jsx,ts,tsx}"];

export default [
	{
		ignores: [
			"dist/**",
			"node_modules/**",
			"coverage/**",
			"test-results/**",
			".playwright-cli/**",
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: frontendFiles,
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: { jsx: true },
			},
		},
		rules: {
			// The existing frontend is an incremental JS/TS migration.
			"no-undef": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
];
