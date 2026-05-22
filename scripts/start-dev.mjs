import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(rootDir, "src", "server");

const commands = [
	{
		name: "client",
		cwd: rootDir,
		args: [path.join(rootDir, "node_modules", "vite", "bin", "vite.js")],
	},
	{
		name: "server",
		cwd: serverDir,
		args: [
			path.join(rootDir, "node_modules", "nodemon", "bin", "nodemon.js"),
			"app.js",
		],
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
	const child = spawn(process.execPath, command.args, {
		cwd: command.cwd,
		env: {
			...process.env,
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
