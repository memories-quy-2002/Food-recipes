import { useEffect, useState, type ReactElement } from "react";
import { isAxiosError, type AxiosResponse } from "axios";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import Button from "@/shared/ui/Button";
import { Activity, CheckCircle2, Database, RefreshCw, Server, Utensils, XCircle, type LucideIcon } from "lucide-react";

type HealthCheckKey = "server" | "database" | "recipes";
type HealthCheck = {
	key: HealthCheckKey;
	label: string;
	description: string;
	request: () => Promise<AxiosResponse<unknown>>;
};
type HealthResult = HealthCheck & {
	ok: boolean;
	statusCode: number | null;
	durationMs: number;
	data: unknown;
	error?: string;
};
type ErrorPayload = { message?: string; errorMessage?: string };

const checks: HealthCheck[] = [
	{
		key: "server",
		label: "API gateway",
		description: "Checks whether the configured API target responds.",
		request: () => axios.get<unknown>(apiRoutes.serverHealth),
	},
	{
		key: "database",
		label: "Database",
		description: "Checks environment flags, SSL setup, and SELECT 1.",
		request: () => axios.get<unknown>(apiRoutes.databaseHealth),
	},
	{
		key: "recipes",
		label: "Recipes API",
		description: "Checks whether recipe data can be fetched.",
		request: () => axios.get<unknown>(apiRoutes.recipes),
	},
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const formatError = (error: unknown): string => {
	if (isAxiosError<ErrorPayload>(error)) {
		return error.response?.data?.message || error.response?.data?.errorMessage || error.message || "Request failed";
	}
	return error instanceof Error ? error.message : "Request failed";
};

const formatDatabaseConfig = (data: unknown): string | null => {
	if (!isRecord(data) || !isRecord(data.config)) return null;
	return Object.entries(data.config)
		.map(([key, value]) => `${key}: ${String(value)}`)
		.join(" | ");
};

const Health = (): ReactElement => {
	const [status, setStatus] = useState<"loading" | "ready">("loading");
	const [results, setResults] = useState<HealthResult[]>([]);

	const runChecks = async (): Promise<void> => {
		setStatus("loading");

		const nextResults = await Promise.all(
			checks.map(async (check) => {
				const startedAt = performance.now();

				try {
					const response = await check.request();
					return {
						...check,
						ok: true,
						statusCode: response.status,
						durationMs: Math.round(performance.now() - startedAt),
						data: response.data,
					};
				} catch (error: unknown) {
					return {
						...check,
						ok: false,
						statusCode: isAxiosError(error) ? error.response?.status || null : null,
						durationMs: Math.round(performance.now() - startedAt),
						error: formatError(error),
						data: isAxiosError(error) ? error.response?.data || null : null,
					};
				}
			})
		);

		setResults(nextResults);
		setStatus("ready");
	};

	useEffect(() => {
		runChecks();
	}, []);

	const failedCount = results.filter((result) => !result.ok).length;
	const statusLabel = status === "loading" ? "Running checks" : failedCount ? `${failedCount} check${failedCount === 1 ? "" : "s"} need attention` : "All systems operational";
	const checkIcons: Record<HealthCheckKey, LucideIcon> = { server: Server, database: Database, recipes: Utensils };

	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
			<PageHelmet
				title="Health Diagnostics"
				description="Check Food Recipes frontend, server, database, and recipe API health."
				path="/health"
				noIndex
			/>
			<div className="mx-auto w-full max-w-6xl">
				<section className="mb-6 flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-2xl">
						<div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
							<Activity className="size-4" aria-hidden="true" />
							<span>Local diagnostics</span>
						</div>
						<h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-foreground sm:text-5xl">System health</h1>
						<p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
							Check the live API connection, database status, and recipe data path from the client.
						</p>
					</div>
					<Button type="button" variant="outline" className="w-full sm:w-auto" onClick={runChecks} disabled={status === "loading"} aria-busy={status === "loading"}>
						<RefreshCw className={status === "loading" ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
						{status === "loading" ? "Running checks" : "Run checks"}
					</Button>
				</section>
			{status === "loading" ? (
				<PageState
					title="Checking system health"
					message="Testing the server, database, and recipe API."
				/>
			) : (
				<>
					<div className={`mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${failedCount ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/20 bg-secondary/55 text-secondary-foreground"}`} role="status" aria-live="polite">
						<div className="flex items-center gap-3">
							{failedCount ? <XCircle className="size-5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />}
							<strong>{statusLabel}</strong>
						</div>
						<span className="text-sm opacity-85">API base: {axios.defaults.baseURL || "same origin"}</span>
					</div>
					<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="System checks">
						{results.map((result) => (
							<article
								key={result.key}
								className={`rounded-2xl border bg-card p-5 shadow-sm ${result.ok ? "border-primary/20" : "border-destructive/30"}`}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex min-w-0 items-center gap-3">
										<div className={`grid size-11 shrink-0 place-items-center rounded-xl ${result.ok ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive"}`}>
											{(() => { const Icon = checkIcons[result.key] || Activity; return <Icon className="size-5" aria-hidden="true" />; })()}
										</div>
										<div className="min-w-0">
											<span className={`text-xs font-black uppercase tracking-[0.14em] ${result.ok ? "text-primary" : "text-destructive"}`}>{result.ok ? "Healthy" : "Failed"}</span>
											<h2 className="mt-1 truncate text-xl font-black text-foreground">{result.label}</h2>
										</div>
									</div>
									<strong className="shrink-0 text-sm tabular-nums text-muted-foreground">{result.durationMs}ms</strong>
								</div>
								<p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">{result.description}</p>
								<dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
									<div className="flex items-center justify-between gap-4">
										<dt className="font-semibold text-muted-foreground">Status</dt>
										<dd className="font-black text-foreground">{result.statusCode || "No response"}</dd>
									</div>
									{result.error && (
										<div className="grid gap-1">
											<dt className="font-semibold text-muted-foreground">Error</dt>
											<dd className="break-words font-semibold text-destructive">{result.error}</dd>
										</div>
									)}
									{result.key === "database" && formatDatabaseConfig(result.data) && (
										<div className="grid gap-1">
											<dt className="font-semibold text-muted-foreground">DB config</dt>
											<dd className="break-words font-semibold text-foreground">
												{formatDatabaseConfig(result.data)}
											</dd>
										</div>
									)}
								</dl>
							</article>
						))}
					</section>
				</>
			)}
			</div>
		</main>
	);
};

export default Health;
