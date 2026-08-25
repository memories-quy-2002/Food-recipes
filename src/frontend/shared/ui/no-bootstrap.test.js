import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const scannedExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".scss"]);

const collectBootstrapReferences = (directory, violations = []) => {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
		const fullPath = join(directory, entry.name);
		if (entry.isDirectory()) {
			collectBootstrapReferences(fullPath, violations);
			continue;
		}
		if (!scannedExtensions.has(extname(entry.name))) continue;
		const source = readFileSync(fullPath, "utf8");
		if (/from\s+["']react-bootstrap(?:\/[^"']+)?["']/.test(source)) {
			violations.push(`${relative(frontendRoot, fullPath)}: react-bootstrap import`);
		}
		if (/bootstrap(?:\.min)?\.css|cdn\.jsdelivr\.net\/npm\/bootstrap/i.test(source)) {
			violations.push(`${relative(frontendRoot, fullPath)}: bootstrap stylesheet/CDN reference`);
		}
	}
	return violations;
};

describe("Bootstrap migration guard", () => {
	it("keeps Bootstrap imports and stylesheets out of the frontend", () => {
		expect(collectBootstrapReferences(frontendRoot)).toEqual([]);
	});

	it("keeps Bootstrap packages out of the frontend manifest", () => {
		const manifest = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8"));
		expect(manifest.dependencies?.bootstrap).toBeUndefined();
		expect(manifest.dependencies?.["react-bootstrap"]).toBeUndefined();
		expect(manifest.devDependencies?.bootstrap).toBeUndefined();
		expect(manifest.devDependencies?.["react-bootstrap"]).toBeUndefined();
	});
});
