import { useLocation, useNavigate } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import JournalForm from "./JournalForm";

const JournalPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const historyId = Number(new URLSearchParams(location.search).get("historyId"));
	if (!Number.isInteger(historyId) || historyId < 1) return <main className="p-6" role="alert">A valid cooking history entry is required.</main>;
	return <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="journal-title">
		<PageHelmet title="Cooking journal" description="Reflect on a finished cook in your private cooking journal." path="/history/journal" noIndex />
		<div className="mx-auto max-w-3xl"><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">Keep the useful details</p><h1 id="journal-title" className="text-4xl font-black tracking-tight sm:text-5xl">How did it go?</h1><p className="mt-3 mb-6 text-muted-foreground">A quick reflection helps you decide what to repeat next time.</p><JournalForm historyId={historyId} onSaved={() => navigate("/history")} /></div>
	</main>;
};

export default JournalPage;
