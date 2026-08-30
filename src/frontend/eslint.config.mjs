import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const frontendFiles = ["**/*.{js,jsx,ts,tsx}"];
const applicationTypeScriptFiles = [
	"app/**/*.{ts,tsx}",
	"features/**/*.{ts,tsx}",
	"shared/**/*.{ts,tsx}",
	"main.{ts,tsx}",
];
const e2eAndToolingFiles = [
	"e2e/**/*.js",
	"tools/**/*.{js,jsx,mjs,cjs,ts,tsx}",
	"*.config.{js,jsx,mjs,cjs,ts,tsx}",
];

export default [
	{
		ignores: [
			"dist/**",
			".temp/**",
			".vite/**",
			".vite-verification/**",
			"node_modules/**",
			"coverage/**",
			"test-results/**",
			"playwright-report/**",
			"output/**",
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
	},
	{
		files: applicationTypeScriptFiles,
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"no-undef": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
		},
	},
	{
		files: e2eAndToolingFiles,
		rules: {
			"no-undef": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
];
