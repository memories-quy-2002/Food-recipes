import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sourceRoot = join(frontendRoot, "src");
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);

const collectBootstrapImports = (directory, violations = []) => {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		if (["node_modules", "dist"].includes(entry.name)) continue;
		const fullPath = join(directory, entry.name);
		if (entry.isDirectory()) {
			collectBootstrapImports(fullPath, violations);
			continue;
		}
		if (!sourceExtensions.has(extname(entry.name))) continue;
		const source = readFileSync(fullPath, "utf8");
		if (/from\s+["']react-bootstrap(?:\/[^"']+)?["']/.test(source)) {
			violations.push(relative(frontendRoot, fullPath));
		}
	}
	return violations;
};

describe("Bootstrap migration guard", () => {
	it("keeps react-bootstrap out of application source", () => {
		expect(collectBootstrapImports(sourceRoot)).toEqual([]);
	});

	it("keeps Bootstrap packages out of the frontend manifest", () => {
		const manifest = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8"));
		expect(manifest.dependencies?.bootstrap).toBeUndefined();
		expect(manifest.dependencies?.["react-bootstrap"]).toBeUndefined();
		expect(manifest.devDependencies?.bootstrap).toBeUndefined();
		expect(manifest.devDependencies?.["react-bootstrap"]).toBeUndefined();
	});
});
