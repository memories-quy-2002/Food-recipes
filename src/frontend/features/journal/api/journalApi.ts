import api from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type JournalPhoto = { photo_id: number; object_path: string; created_at: string };
export type CookingJournal = {
	journal_id: number;
	history_id: number;
	rating: number | null;
	would_cook_again: boolean | null;
	notes: string | null;
	photos?: JournalPhoto[];
};

export type JournalInput = {
	rating?: number | null;
	wouldCookAgain?: boolean | null;
	notes?: string;
	photos?: string[];
};

export const getJournal = async (historyId: number): Promise<{ journal: CookingJournal | null }> => {
	const response = await api.get<{ journal: CookingJournal | null }>(apiRoutes.cookingJournal(historyId));
	return response.data;
};

export const saveJournal = async (historyId: number, input: JournalInput): Promise<{ journal: CookingJournal }> => {
	const response = await api.put<{ journal: CookingJournal }>(apiRoutes.cookingJournal(historyId), input);
	return response.data;
};

export const uploadJournalPhoto = async (file: File): Promise<string> => {
	if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
	if (file.size > 5 * 1024 * 1024) throw new Error("Photos must be 5 MiB or smaller.");
	const grantResponse = await api.post<{ uploadUrl: string; objectPath: string }>(apiRoutes.journalPhotoUpload, { filename: file.name, contentType: file.type, size: file.size });
	const uploadResponse = await fetch(grantResponse.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
	if (!uploadResponse.ok) throw new Error("Photo upload failed. Your journal text is still here.");
	return grantResponse.data.objectPath;
};
