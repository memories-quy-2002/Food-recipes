import { useLocation, useNavigate } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageHeader from "@/shared/ui/PageHeader";
import JournalForm from "./JournalForm";

const JournalPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const historyId = Number(new URLSearchParams(location.search).get("historyId"));
	if (!Number.isInteger(historyId) || historyId < 1) return <main className="p-6" role="alert">A valid cooking history entry is required.</main>;
	return <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="journal-title">
		<PageHelmet title="Cooking journal" description="Reflect on a finished cook in your private cooking journal." path="/history/journal" noIndex />
		<div className="mx-auto w-full min-w-0 max-w-3xl"><PageHeader headingId="journal-title" eyebrow="Keep the useful details" title="How did it go?" description="A quick reflection helps you decide what to repeat next time." className="mb-6 gap-0 border-0 pb-0" /><JournalForm historyId={historyId} onSaved={() => navigate("/history")} /></div>
	</main>;
};

export default JournalPage;
