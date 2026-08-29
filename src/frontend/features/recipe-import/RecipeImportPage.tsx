import { useState, type FormEvent, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/shared/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/Card";
import PageHelmet from "@/shared/seo/PageHelmet";
import { previewRecipeImport, saveImportedRecipeDraft, type RecipeImportPreview } from "./api/recipeImportApi";
import { trackProductEvent } from "@/shared/analytics/productAnalytics";

type EditablePreview = RecipeImportPreview & {
	ingredientsText: string;
	instructionsText: string;
};

const toEditable = (preview: RecipeImportPreview): EditablePreview => ({
	...preview,
	ingredientsText: preview.ingredients.join("\n"),
	instructionsText: preview.instructions.join("\n"),
});

const getErrorMessage = (error: unknown, fallback: string): string => {
	if (typeof error === "object" && error !== null && "response" in error) {
		const response = (error as { response?: { data?: { message?: string } } }).response;
		if (response?.data?.message) return response.data.message;
	}
	return fallback;
};

const RecipeImportPage = (): ReactElement => {
	const navigate = useNavigate();
	const [url, setUrl] = useState("");
	const [preview, setPreview] = useState<EditablePreview | null>(null);
	const [error, setError] = useState("");
	const [status, setStatus] = useState<"idle" | "previewing" | "saving">("idle");

	const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		try {
			new URL(url);
			if (!/^https?:$/i.test(new URL(url).protocol)) throw new Error("Only http(s) URLs are supported.");
		} catch {
			setError("Enter a valid http(s) recipe URL.");
			return;
		}
		setStatus("previewing");
		try {
			setPreview(toEditable(await previewRecipeImport(url.trim())));
		} catch (requestError) {
			setError(getErrorMessage(requestError, "This page could not be imported. Try another recipe URL."));
		} finally {
			setStatus("idle");
		}
	};

	const handleSave = async () => {
		if (!preview?.name.trim()) {
			setError("Add a recipe name before saving.");
			return;
		}
		setError("");
		setStatus("saving");
		try {
			await saveImportedRecipeDraft({
				sourceUrl: preview.sourceUrl,
				name: preview.name.trim(),
				description: preview.description,
				ingredients: preview.ingredientsText.split("\n").map((item) => item.trim()).filter(Boolean),
				instructions: preview.instructionsText.split("\n").map((item) => item.trim()).filter(Boolean),
				prepTimeMinutes: preview.prepTimeMinutes,
				cookTimeMinutes: preview.cookTimeMinutes,
				imageUrl: preview.imageUrl,
			});
			trackProductEvent("recipe_import_completed", { source: "jsonld", status: "draft" });
			navigate("/profile");
		} catch (requestError) {
			setError(getErrorMessage(requestError, "Your draft could not be saved. Your edits are still here."));
		} finally {
			setStatus("idle");
		}
	};

	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="recipe-import-title">
			<PageHelmet title="Import recipe" description="Preview a recipe from a public URL and save it as a private draft." path="/recipes/import" noIndex />
			<div className="mx-auto max-w-3xl">
				<p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">Bring a recipe into your kitchen</p>
				<h1 id="recipe-import-title" className="text-4xl font-black tracking-tight sm:text-5xl">Import a recipe</h1>
				<p className="mt-3 max-w-2xl text-muted-foreground">Paste a public recipe URL. Review every field before it becomes a private draft.</p>
				<Card className="mt-6">
					<CardHeader><CardTitle>Paste URL</CardTitle><CardDescription>Only public http(s) pages with Recipe JSON-LD are supported.</CardDescription></CardHeader>
					<CardContent>
						<form className="flex flex-col gap-3 sm:flex-row" onSubmit={handlePreview}>
							<label className="sr-only" htmlFor="recipe-import-url">Recipe URL</label>
							<input id="recipe-import-url" className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/recipe" type="url" required />
							<Button type="submit" disabled={status !== "idle"}>{status === "previewing" ? "Previewing…" : "Preview recipe"}</Button>
						</form>
					</CardContent>
				</Card>
				{error ? <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm" role="alert">{error}</p> : null}
				{preview ? (
					<Card className="mt-6">
						<CardHeader><CardTitle>Edit preview</CardTitle><CardDescription>This will be saved as a draft only. You can finish required fields later.</CardDescription></CardHeader>
						<CardContent className="grid gap-4">
							<label className="grid gap-1 text-sm font-semibold" htmlFor="import-name">Name<input id="import-name" className="min-h-11 rounded-md border border-input bg-background px-3 font-normal" value={preview.name} onChange={(event) => setPreview({ ...preview, name: event.target.value })} /></label>
							<label className="grid gap-1 text-sm font-semibold" htmlFor="import-description">Description<textarea id="import-description" className="min-h-24 rounded-md border border-input bg-background p-3 font-normal" value={preview.description ?? ""} onChange={(event) => setPreview({ ...preview, description: event.target.value })} /></label>
							<label className="grid gap-1 text-sm font-semibold" htmlFor="import-ingredients">Ingredients<textarea id="import-ingredients" className="min-h-32 rounded-md border border-input bg-background p-3 font-normal" value={preview.ingredientsText} onChange={(event) => setPreview({ ...preview, ingredientsText: event.target.value })} /></label>
							<label className="grid gap-1 text-sm font-semibold" htmlFor="import-instructions">Instructions<textarea id="import-instructions" className="min-h-32 rounded-md border border-input bg-background p-3 font-normal" value={preview.instructionsText} onChange={(event) => setPreview({ ...preview, instructionsText: event.target.value })} /></label>
							<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setPreview(null)}>Start over</Button><Button onClick={handleSave} disabled={status !== "idle"}>{status === "saving" ? "Saving draft…" : "Save draft"}</Button></div>
						</CardContent>
					</Card>
				) : null}
			</div>
		</main>
	);
};

export default RecipeImportPage;
