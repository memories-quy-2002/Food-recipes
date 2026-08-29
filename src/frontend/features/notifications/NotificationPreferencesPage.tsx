import { useEffect, useState } from "react";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { useNotificationPreferencesQuery, useUpdateNotificationPreferencesMutation } from "./api/notificationsQueries";
import type { NotificationPreferences } from "./api/notificationsApi";

const labels: Array<[keyof NotificationPreferences, string, string]> = [
	["pantryExpiry", "Pantry expiry alerts", "Know when an ingredient needs using."],
	["mealReminder", "Meal reminders", "Keep the next planned meal visible."],
	["resumeCooking", "Resume cooking reminders", "Get a nudge for paused cooking sessions."],
	["weeklyPlan", "Weekly plan reminders", "Stay on top of an unfinished week."],
	["householdActivity", "Household activity", "See invites and shared kitchen activity."],
];

const NotificationPreferencesPage = () => {
	const query = useNotificationPreferencesQuery();
	const mutation = useUpdateNotificationPreferencesMutation();
	const [draft, setDraft] = useState<NotificationPreferences | null>(null);
	useEffect(() => { if (query.data?.preferences) setDraft(query.data.preferences); }, [query.data]);
	const save = () => { if (draft) mutation.mutate(draft); };

	return <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="notification-preferences-title"><PageHelmet title="Notification preferences" description="Choose which in-app reminders you receive." path="/profile/notifications" noIndex /><div className="mx-auto max-w-3xl"><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">Your attention, your rules</p><h1 id="notification-preferences-title" className="text-4xl font-black tracking-tight sm:text-5xl">Notification preferences</h1><p className="mt-3 text-muted-foreground">Turn optional reminders on or off. Household invites remain visible so shared access cannot be missed.</p><Card className="mt-6 divide-y divide-border p-2 sm:p-4">{query.isPending || !draft ? <p className="p-4 text-sm text-muted-foreground">Loading preferences…</p> : labels.map(([key, label, description]) => <label key={key} className="flex min-h-16 items-center justify-between gap-4 rounded-xl px-3 py-3"><span><strong className="block text-sm font-black">{label}</strong><span className="text-xs text-muted-foreground">{description}</span></span><input type="checkbox" className="size-5 shrink-0 accent-primary" aria-label={label} checked={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })} /></label>)}</Card><Button className="mt-5" onClick={save} disabled={!draft || mutation.isPending} aria-busy={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save notification preferences"}</Button></div></main>;
};

export default NotificationPreferencesPage;
