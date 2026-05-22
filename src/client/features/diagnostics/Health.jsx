import React, { useEffect, useState } from "react";
import axios from "@/shared/api/axios";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";

const checks = [
	{
		key: "server",
		label: "Server",
		description: "Checks whether the Express app responds.",
		request: () => axios.get("/"),
	},
	{
		key: "database",
		label: "Database",
		description: "Checks environment flags, SSL setup, and SELECT 1.",
		request: () => axios.get("/health/database"),
	},
	{
		key: "recipes",
		label: "Recipes API",
		description: "Checks whether recipe data can be fetched.",
		request: () => axios.get("/recipe"),
	},
];

const formatError = (error) =>
	error.response?.data?.message ||
	error.response?.data?.errorMessage ||
	error.message ||
	"Request failed";

const Health = () => {
	const [status, setStatus] = useState("loading");
	const [results, setResults] = useState([]);

	const runChecks = async () => {
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
				} catch (error) {
					return {
						...check,
						ok: false,
						statusCode: error.response?.status || null,
						durationMs: Math.round(performance.now() - startedAt),
						error: formatError(error),
						data: error.response?.data || null,
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

	return (
		<main className="health">
			<PageHelmet
				title="Health Diagnostics"
				description="Check Food Recipes frontend, server, database, and recipe API health."
				path="/health"
				noIndex
			/>
			<section className="health__hero">
				<div>
					<span>Diagnostics</span>
					<h1>System health</h1>
					<p>
						Check the live API connection, database status, and recipe
						data path from the client.
					</p>
				</div>
				<button type="button" onClick={runChecks}>
					Run checks
				</button>
			</section>
			{status === "loading" ? (
				<PageState
					title="Checking system health"
					message="Testing the server, database, and recipe API."
				/>
			) : (
				<>
					<div
						className={`health__summary ${
							failedCount ? "health__summary--error" : ""
						}`}
					>
						<strong>
							{failedCount
								? `${failedCount} check${
										failedCount === 1 ? "" : "s"
								  } failed`
								: "All checks passed"}
						</strong>
						<span>
							API base: {axios.defaults.baseURL || "same origin"}
						</span>
					</div>
					<section className="health__grid">
						{results.map((result) => (
							<article
								key={result.key}
								className={`health__card ${
									result.ok ? "health__card--ok" : "health__card--error"
								}`}
							>
								<div className="health__card__header">
									<div>
										<span>{result.ok ? "Healthy" : "Failed"}</span>
										<h2>{result.label}</h2>
									</div>
									<strong>{result.durationMs}ms</strong>
								</div>
								<p>{result.description}</p>
								<dl>
									<div>
										<dt>Status</dt>
										<dd>{result.statusCode || "No response"}</dd>
									</div>
									{result.error && (
										<div>
											<dt>Error</dt>
											<dd>{result.error}</dd>
										</div>
									)}
									{result.key === "database" && result.data?.config && (
										<div>
											<dt>DB config</dt>
											<dd>
												{Object.entries(result.data.config)
													.map(([key, value]) => `${key}: ${value}`)
													.join(" | ")}
											</dd>
										</div>
									)}
								</dl>
							</article>
						))}
					</section>
				</>
			)}
		</main>
	);
};

export default Health;
