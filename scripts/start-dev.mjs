import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(rootDir, "src", "backend", "apps", "api");
const backendCommand =
	process.platform === "win32"
		? {
				command: process.env.ComSpec ?? "cmd.exe",
				args: ["/d", "/s", "/c", "pnpm.cmd", "start:dev"],
			}
		: { command: "pnpm", args: ["start:dev"] };

const commands = [
	{
		name: "client",
		command: process.execPath,
		cwd: rootDir,
		args: [path.join(rootDir, "node_modules", "vite", "bin", "vite.js")],
	},
	{
		name: "backend",
		command: backendCommand.command,
		cwd: backendDir,
		args: backendCommand.args,
	},
];

const children = new Set();
let isShuttingDown = false;

const prefixOutput = (name, stream, data) => {
	const lines = data.toString().split(/\r?\n/);
	lines.forEach((line, index) => {
		if (!line && index === lines.length - 1) return;
		stream.write(`[${name}] ${line}\n`);
	});
};

const stopChildren = () => {
	isShuttingDown = true;
	for (const child of children) {
		if (!child.killed) {
			child.kill("SIGTERM");
		}
	}
};

for (const command of commands) {
	const child = spawn(command.command, command.args, {
		cwd: command.cwd,
		env: {
			...process.env,
			...(command.name === "client"
				? {
						VITE_KONG_BASE_URL:
							process.env.VITE_KONG_BASE_URL ?? "http://localhost:3000",
					}
				: {}),
			FORCE_COLOR: "1",
		},
		stdio: ["inherit", "pipe", "pipe"],
	});

	children.add(child);
	child.stdout.on("data", (data) => prefixOutput(command.name, process.stdout, data));
	child.stderr.on("data", (data) => prefixOutput(command.name, process.stderr, data));
	child.on("error", (error) => {
		console.error(`[${command.name}] failed to start: ${error.message}`);
		stopChildren();
		process.exitCode = 1;
	});
	child.on("exit", (code, signal) => {
		children.delete(child);
		if (!isShuttingDown) {
			const status = signal || `code ${code}`;
			console.error(`[${command.name}] exited with ${status}; stopping dev servers.`);
			stopChildren();
			process.exitCode = code || 1;
		}
	});
}

process.on("SIGINT", stopChildren);
process.on("SIGTERM", stopChildren);
