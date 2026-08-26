import { readdir } from "node:fs/promises";
import path from "node:path";

const frontendRoot = process.cwd();
const applicationRoots = ["app", "features", "shared"];
const applicationEntryPoints = ["main.js", "main.jsx"];
const disallowedExtensions = new Set([".js", ".jsx"]);
const excludedDirectories = new Set([
	"e2e",
	"node_modules",
	"dist",
	"coverage",
	"tools",
	"tooling",
]);

async function collectJavaScriptFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (!excludedDirectories.has(entry.name)) {
				files.push(...(await collectJavaScriptFiles(path.join(directory, entry.name))));
			}
			continue;
		}

		if (disallowedExtensions.has(path.extname(entry.name).toLowerCase())) {
			files.push(path.join(directory, entry.name));
		}
	}

	return files;
}

const applicationFiles = [];
for (const root of applicationRoots) {
	applicationFiles.push(...(await collectJavaScriptFiles(path.join(frontendRoot, root))));
}

const frontendEntries = await readdir(frontendRoot, { withFileTypes: true });
for (const entry of frontendEntries) {
	if (entry.isFile() && applicationEntryPoints.includes(entry.name)) {
		applicationFiles.push(path.join(frontendRoot, entry.name));
	}
}

const failures = [...new Set(applicationFiles)]
	.map((file) => path.relative(frontendRoot, file).split(path.sep).join("/"))
	.sort();

if (failures.length > 0) {
	console.error("Application source contains disallowed JavaScript files:");
	for (const failure of failures) console.error(failure);
	process.exitCode = 1;
} else {
	console.log("Application source is TypeScript-only.");
}
