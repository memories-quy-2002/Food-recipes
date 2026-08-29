import { useEffect, useState, type ChangeEvent, type ReactElement } from "react";
import Button from "@/shared/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/Card";
import { getJournal, saveJournal, uploadJournalPhoto, type CookingJournal } from "./api/journalApi";

type JournalDraft = { rating: string; wouldCookAgain: boolean | null; notes: string; photos: string[] };
const emptyDraft: JournalDraft = { rating: "", wouldCookAgain: null, notes: "", photos: [] };
const toDraft = (journal: CookingJournal | null): JournalDraft => journal ? { rating: journal.rating ? String(journal.rating) : "", wouldCookAgain: journal.would_cook_again, notes: journal.notes ?? "", photos: journal.photos?.map((photo) => photo.object_path) ?? [] } : emptyDraft;

type JournalFormProps = { historyId: number; initialJournal?: CookingJournal | null; onSaved?: () => void };

const JournalForm = ({ historyId, initialJournal, onSaved }: JournalFormProps): ReactElement => {
	const [draft, setDraft] = useState<JournalDraft>(initialJournal === undefined ? emptyDraft : toDraft(initialJournal));
	const [loading, setLoading] = useState(initialJournal === undefined);
	const [saving, setSaving] = useState(false);
	const [photoError, setPhotoError] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialJournal !== undefined) return;
		let active = true;
		getJournal(historyId).then(({ journal }) => { if (active) setDraft(toDraft(journal)); }).catch(() => { if (active) setError("This journal entry could not load."); }).finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [historyId, initialJournal]);

	const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const files = [...(event.target.files ?? [])].slice(0, 10 - draft.photos.length);
		if (!files.length) return;
		setPhotoError("");
		for (const file of files) {
			try {
				const path = await uploadJournalPhoto(file);
				setDraft((current) => ({ ...current, photos: [...current.photos, path] }));
			} catch (uploadError) {
				setPhotoError(uploadError instanceof Error ? uploadError.message : "Photo upload failed. Your journal text is still here.");
			}
		}
		event.target.value = "";
	};

	const handleSave = async () => {
		setSaving(true);
		setError("");
		try {
			await saveJournal(historyId, { rating: draft.rating ? Number(draft.rating) : null, wouldCookAgain: draft.wouldCookAgain, notes: draft.notes, photos: draft.photos });
			onSaved?.();
		} catch {
			setError("Your journal could not be saved. Your draft is still here.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <Card className="p-6" aria-busy="true">Loading journal…</Card>;
	return <Card>
		<CardHeader><CardTitle>Post-cook reflection</CardTitle><CardDescription>Your journal is private and separate from public recipe ratings.</CardDescription></CardHeader>
		<CardContent className="grid gap-5">
			<label className="grid gap-1 text-sm font-semibold" htmlFor="journal-rating">Your rating<select id="journal-rating" className="min-h-11 rounded-md border border-input bg-background px-3 font-normal" value={draft.rating} onChange={(event) => setDraft({ ...draft, rating: event.target.value })}><option value="">Not rated</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</select></label>
			<label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-primary" checked={draft.wouldCookAgain === true} onChange={(event) => setDraft({ ...draft, wouldCookAgain: event.target.checked })} />Would cook this again</label>
			<label className="grid gap-1 text-sm font-semibold" htmlFor="journal-notes">Private notes<textarea id="journal-notes" className="min-h-32 rounded-md border border-input bg-background p-3 font-normal" maxLength={4000} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="What worked? What would you change?" /></label>
			<label className="grid gap-1 text-sm font-semibold" htmlFor="journal-photos">Photos<span className="text-xs font-normal text-muted-foreground">Up to 10 images, 5 MiB each.</span><input id="journal-photos" aria-label="Photos" type="file" accept="image/*" multiple onChange={handlePhotoChange} /></label>
			{draft.photos.length ? <ul aria-label="Uploaded journal photos" className="grid gap-2 text-xs text-muted-foreground">{draft.photos.map((path) => <li key={path} className="rounded-md bg-muted px-3 py-2">{path}</li>)}</ul> : null}
			{photoError ? <p role="alert" className="text-sm text-destructive">{photoError}</p> : null}
			{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
			<Button onClick={handleSave} disabled={saving}>{saving ? "Saving journal…" : "Save journal"}</Button>
		</CardContent>
	</Card>;
};

export default JournalForm;
