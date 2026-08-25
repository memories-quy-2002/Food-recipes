import React, { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import {
	useDeleteRecipeNoteMutation,
	useRecipeNoteQuery,
	useSaveRecipeNoteMutation,
} from "@/features/recipes/api/notesQueries";
import Button from "@/shared/ui/Button";

const NOTE_MAX_LENGTH = 2000;

const PrivateRecipeNotes = ({ recipeId, isAuthenticated }) => {
	const noteQuery = useRecipeNoteQuery(Number(recipeId), isAuthenticated);
	const saveMutation = useSaveRecipeNoteMutation();
	const deleteMutation = useDeleteRecipeNoteMutation();
	const [draft, setDraft] = useState("");
	const [message, setMessage] = useState(null);

	useEffect(() => {
		setDraft(noteQuery.data?.note?.note ?? "");
	}, [noteQuery.data?.note?.note]);

	if (!isAuthenticated) return null;

	const save = () => {
		setMessage(null);
		saveMutation.mutate(
			{ recipeId: Number(recipeId), note: draft.trim() },
			{
				onSuccess: () => setMessage("Note saved."),
				onError: () => setMessage("We could not save your note. Try again."),
			},
		);
	};

	const remove = () => {
		setMessage(null);
		deleteMutation.mutate(Number(recipeId), {
			onSuccess: () => {
				setDraft("");
				setMessage("Note removed.");
			},
			onError: () => setMessage("We could not remove your note. Try again."),
		});
	};

	return (
		<section className="mx-auto w-full max-w-[100rem] px-4 pb-8 sm:px-6 lg:px-8 2xl:max-w-[108rem]" aria-labelledby="private-recipe-notes-title">
			<div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
				<div className="flex items-start gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><LockKeyhole className="size-5" aria-hidden="true" /></div>
					<div>
						<h2 id="private-recipe-notes-title" className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">My notes</h2>
						<p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">Private to your account. Save substitutions, timing changes, or ideas for next time.</p>
					</div>
				</div>

				{noteQuery.isLoading ? (
					<p className="mt-6 text-sm text-muted-foreground" role="status">Loading your note…</p>
				) : noteQuery.isError ? (
					<p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">We could not load your note. Try again later.</p>
				) : (
					<div className="mt-6">
						<label htmlFor="private-recipe-note" className="text-sm font-black text-foreground">Private notes</label>
						<textarea
							id="private-recipe-note"
							value={draft}
							maxLength={NOTE_MAX_LENGTH}
							rows={6}
							placeholder="E.g. use less salt, bake 5 minutes longer, try basil next time…"
							onChange={(event) => setDraft(event.target.value)}
							className="mt-2 min-h-40 w-full resize-y rounded-xl border border-input bg-background px-4 py-3.5 text-base leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-ring focus:ring-4 focus:ring-ring/20 sm:text-sm"
						/>
						<div className="mt-1 flex justify-end text-xs text-muted-foreground">{draft.length}/{NOTE_MAX_LENGTH}</div>
						<div className="mt-4 flex flex-col gap-2 sm:flex-row">
							<Button type="button" size="lg" className="rounded-xl font-black" onClick={save} disabled={saveMutation.isPending || deleteMutation.isPending}>{saveMutation.isPending ? "Saving…" : "Save note"}</Button>
							{noteQuery.data?.note ? <Button type="button" size="lg" variant="outline" className="rounded-xl font-black" onClick={remove} disabled={saveMutation.isPending || deleteMutation.isPending}>Remove note</Button> : null}
						</div>
					</div>
				)}
				{message ? <p className="mt-4 text-sm font-semibold text-muted-foreground" role="status">{message}</p> : null}
			</div>
		</section>
	);
};

export default PrivateRecipeNotes;
