import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteCli = path.join(frontendRoot, "node_modules/vite/bin/vite.js");
const playwrightCli = path.join(frontendRoot, "node_modules/@playwright/test/cli.js");
const localBuildDirectory = ".temp/playwright-real-stack-build";
const apiOrigin = process.env.FOOD_RECIPES_E2E_API_ORIGIN || "http://localhost:3000";
const webBaseURL = process.env.FOOD_RECIPES_E2E_WEB_URL || "http://localhost:5173";
const webURL = new URL(webBaseURL);
const webPort = webURL.port || (webURL.protocol === "https:" ? "443" : "80");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const runProcess = (executable, args, options = {}) =>
	new Promise((resolve, reject) => {
		const child = spawn(executable, args, {
			cwd: frontendRoot,
			env: {
				...process.env,
				VITE_API_BASE_URL: apiOrigin,
				...options.env,
			},
			stdio: "inherit",
			windowsHide: true,
			...options,
		});

		child.once("error", reject);
		child.once("exit", (code, signal) => resolve({ code: code ?? 1, signal }));
	});

const waitForWebServer = async (url, previewProcess, timeoutMilliseconds = 120000) => {
	const deadline = Date.now() + timeoutMilliseconds;

	while (Date.now() < deadline) {
		if (previewProcess.exitCode !== null) {
			throw new Error(`Vite preview exited before becoming ready (code ${previewProcess.exitCode})`);
		}

		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(2000),
			});
			if (response.ok) {
				return;
			}
		} catch {
			// The preview server can take a few seconds to bind its port.
		}

		await sleep(250);
	}

	throw new Error(`Timed out waiting for Vite preview at ${url}`);
};

const stopProcessTree = (child) => {
	if (!child?.pid) {
		return;
	}

	if (process.platform === "win32") {
		try {
			process.kill(child.pid);
		} catch {
			// The preview may already have exited during a failed test run.
		}

		try {
			execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
				stdio: "ignore",
				windowsHide: true,
				timeout: 5000,
			});
		} catch {
			// The preview may already have exited during a failed test run.
		}
		return;
	}

	try {
		process.kill(-child.pid, "SIGTERM");
	} catch {
		try {
			process.kill(child.pid, "SIGTERM");
		} catch {
			// The preview may already have exited during a failed test run.
		}
	}
};

let previewProcess;

try {
	if (!process.env.CI) {
		const build = await runProcess(process.execPath, [
			viteCli,
			"build",
			"--outDir",
			localBuildDirectory,
			"--emptyOutDir",
		]);

		if (build.code !== 0) {
			process.exitCode = build.code;
			throw new Error(`Vite build failed with exit code ${build.code}`);
		}
	}

	const previewArguments = ["preview"];
	if (!process.env.CI) {
		previewArguments.push("--outDir", localBuildDirectory);
	}
	previewArguments.push("--host", "127.0.0.1", "--port", webPort);

	previewProcess = spawn(process.execPath, [viteCli, ...previewArguments], {
		cwd: frontendRoot,
		env: {
			...process.env,
			VITE_API_BASE_URL: apiOrigin,
		},
		stdio: "inherit",
		windowsHide: true,
		detached: process.platform !== "win32",
	});

	await waitForWebServer(webBaseURL, previewProcess);

	const testArguments = process.argv.slice(2);
	if (testArguments[0] === "--") {
		testArguments.shift();
	}
	const test = await runProcess(process.execPath, [
		playwrightCli,
		"test",
		"--config",
		"e2e/real-stack.playwright.config.js",
		...testArguments,
	]);
	process.exitCode = test.code;
} finally {
	stopProcessTree(previewProcess);
}
