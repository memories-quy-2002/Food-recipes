import React, { useEffect, useState } from "react";
import {
	useDeleteRecipeNoteMutation,
	useRecipeNoteQuery,
	useSaveRecipeNoteMutation,
} from "@/features/recipes/api/notesQueries";

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
		<section className="recipe__content__notes" aria-labelledby="private-recipe-notes-title">
			<div>
				<h2 id="private-recipe-notes-title">My notes</h2>
				<p>Private to your account. Use notes for substitutions, timing, or next-time changes.</p>
			</div>
			{noteQuery.isLoading ? (
				<p role="status">Loading your note…</p>
			) : noteQuery.isError ? (
				<p role="alert">We could not load your note. Try again later.</p>
			) : (
				<>
					<label htmlFor="private-recipe-note">Private notes</label>
					<textarea
						id="private-recipe-note"
						value={draft}
						maxLength={NOTE_MAX_LENGTH}
						rows={5}
						onChange={(event) => setDraft(event.target.value)}
					/>
					<div className="recipe__content__notes__actions">
						<button type="button" onClick={save} disabled={saveMutation.isPending || deleteMutation.isPending}>
							{saveMutation.isPending ? "Saving…" : "Save note"}
						</button>
						{noteQuery.data?.note && (
							<button type="button" onClick={remove} disabled={saveMutation.isPending || deleteMutation.isPending}>
								Remove note
							</button>
						)}
					</div>
				</>
			)}
			{message && <p role="status">{message}</p>}
		</section>
	);
};

export default PrivateRecipeNotes;
