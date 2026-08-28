import { FormEvent, useState, type ReactElement } from "react";
import { useSearchParams } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import { useAcceptHouseholdInviteMutation, useCreateHouseholdInviteMutation, useCreateHouseholdMutation, useHouseholdsQuery } from "./api/householdsQueries";

const HouseholdsPage = (): ReactElement => {
	const householdsQuery = useHouseholdsQuery();
	const createMutation = useCreateHouseholdMutation();
	const inviteMutation = useCreateHouseholdInviteMutation();
	const acceptMutation = useAcceptHouseholdInviteMutation();
	const [searchParams] = useSearchParams();
	const [name, setName] = useState("");
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteToken, setInviteToken] = useState(() => searchParams.get("invite") ?? "");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const households = householdsQuery.data?.households ?? [];
	const ownerHousehold = households.find((household) => household.role === "OWNER");

	const submitCreate = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!name.trim()) return setError("Give your household a name first.");
		setError(null);
		createMutation.mutate(name.trim(), { onSuccess: () => { setName(""); setMessage("Household created."); } });
	};

	const submitInvite = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!ownerHousehold || !inviteEmail.trim()) return setError("Add an email address to invite.");
		setError(null);
		inviteMutation.mutate({ householdId: ownerHousehold.household_id, email: inviteEmail.trim() }, {
			onSuccess: (result) => { setInviteEmail(""); setInviteToken(result.token); setMessage("Invite created. Share this token once with the person you invited."); },
		});
	};

	const submitAccept = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!inviteToken.trim()) return setError("Paste an invite token first.");
		setError(null);
		acceptMutation.mutate(inviteToken.trim(), {
			onSuccess: () => setMessage("Invite accepted. Your household list will refresh shortly."),
			onError: () => setError("This invite is invalid, expired, or already used."),
		});
	};

	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="households-title">
			<PageHelmet title="Household kitchens" description="Share pantry, planning, and shopping with your household." path="/households" noIndex />
			<div className="mx-auto grid w-full max-w-5xl gap-6">
				<header><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">Shared kitchen</p><h1 id="households-title" className="text-4xl font-black tracking-tight sm:text-5xl">Household kitchens</h1><p className="mt-3 max-w-2xl text-muted-foreground">Keep a personal kitchen separate from the pantry, plan, and shopping list you share with the people you cook for.</p></header>
				{message && <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900" role="status">{message}</p>}
				{error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive" role="alert">{error}</p>}
				<section className="grid gap-6 lg:grid-cols-2" aria-label="Household controls">
					<Card className="p-5"><h2 className="text-xl font-black">Your households</h2>{householdsQuery.isPending ? <p className="mt-3 text-sm text-muted-foreground">Loading households…</p> : households.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">You do not belong to a household yet.</p> : <ul className="mt-4 grid gap-3">{households.map((household) => <li key={household.household_id} className="rounded-xl border border-border px-4 py-3"><div className="flex items-center justify-between gap-3"><span className="font-bold">{household.name}</span><span className="rounded-full bg-secondary px-2 py-1 text-xs font-black">{household.role}</span></div></li>)}</ul>}<form className="mt-5 grid gap-3 border-t border-border pt-5" onSubmit={submitCreate}><label className="grid gap-2 text-sm font-bold" htmlFor="household-name">Create a household<Input id="household-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Smith Household" /></label><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create household"}</Button></form></Card>
					<Card className="p-5"><h2 className="text-xl font-black">Invite or join</h2>{ownerHousehold ? <form className="mt-4 grid gap-3" onSubmit={submitInvite}><label className="grid gap-2 text-sm font-bold" htmlFor="invite-email">Invite email<Input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="friend@example.com" /></label><Button type="submit" variant="secondary" disabled={inviteMutation.isPending}>{inviteMutation.isPending ? "Creating invite…" : `Invite to ${ownerHousehold.name}`}</Button></form> : <p className="mt-3 text-sm text-muted-foreground">Only a household owner can send invites.</p>}<form className="mt-6 grid gap-3 border-t border-border pt-5" onSubmit={submitAccept}><label className="grid gap-2 text-sm font-bold" htmlFor="invite-token">Invite token<Input id="invite-token" value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} placeholder="Paste the one-time token" /></label><Button type="submit" variant="outline" disabled={acceptMutation.isPending}>{acceptMutation.isPending ? "Accepting…" : "Accept invite"}</Button></form></Card>
				</section>
			</div>
		</main>
	);
};

export default HouseholdsPage;
