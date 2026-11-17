import { FormEvent, useState, type ReactElement } from "react";
import { useSearchParams } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import PageHeader from "@/shared/ui/PageHeader";
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
		if (createMutation.isPending) return;
		if (!name.trim()) return setError("Give your household a name first.");
		setError(null);
		createMutation.mutate(name.trim(), {
			onSuccess: () => { setName(""); setMessage("Household created."); },
			onError: () => setError("We could not create your household. Try again."),
		});
	};

	const submitInvite = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (inviteMutation.isPending) return;
		if (!ownerHousehold || !inviteEmail.trim()) return setError("Add an email address to invite.");
		setError(null);
		inviteMutation.mutate({ householdId: ownerHousehold.household_id, email: inviteEmail.trim() }, {
			onSuccess: (result) => { setInviteEmail(""); setInviteToken(result.token); setMessage("Invite created. Share this token once with the person you invited."); },
			onError: () => setError("We could not create this invite. Check your household role and try again."),
		});
	};

	const submitAccept = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (acceptMutation.isPending) return;
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
				<PageHeader headingId="households-title" eyebrow="Shared kitchen" title="Household kitchens" description="Keep a personal kitchen separate from the pantry, plan, and shopping list you share with the people you cook for." className="mb-0 gap-0 border-0 pb-0 lg:flex-col lg:items-start" />
				{message && <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900" role="status">{message}</p>}
				{error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive" role="alert">{error}</p>}
				<section className="grid min-w-0 gap-6 lg:grid-cols-2" aria-label="Household controls">
					<Card className="min-w-0 p-5">
						<h2 className="text-xl font-black">Your households</h2>
						{householdsQuery.isPending ? (
							<p className="mt-3 text-sm text-muted-foreground">Loading households…</p>
						) : householdsQuery.isError ? (
							<div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4" role="alert">
								<p className="text-sm font-semibold text-destructive">We could not load your households.</p>
								<Button className="mt-3" variant="outline" size="sm" onClick={() => householdsQuery.refetch()}>Try again</Button>
							</div>
						) : households.length === 0 ? (
							<p className="mt-3 text-sm text-muted-foreground">You do not belong to a household yet.</p>
						) : (
							<ul className="mt-4 grid min-w-0 gap-3">
								{households.map((household) => (
									<li key={household.household_id} className="min-w-0 rounded-xl border border-border px-4 py-3">
										<div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
											<span className="min-w-0 [overflow-wrap:anywhere] font-bold">{household.name}</span>
											<span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-xs font-black">{household.role}</span>
										</div>
									</li>
								))}
							</ul>
						)}
						<form className="mt-5 grid gap-3 border-t border-border pt-5" onSubmit={submitCreate}>
							<label className="grid gap-2 text-sm font-bold" htmlFor="household-name">
								Create a household
								<Input id="household-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Smith Household" />
							</label>
							<Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create household"}</Button>
						</form>
					</Card>
					<Card className="min-w-0 p-5">
						<h2 className="text-xl font-black">Invite or join</h2>
						{ownerHousehold ? (
							<form className="mt-4 grid gap-3" onSubmit={submitInvite}>
								<label className="grid gap-2 text-sm font-bold" htmlFor="invite-email">
									Invite email
									<Input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="friend@example.com" />
								</label>
								<Button type="submit" variant="secondary" className="w-full max-w-full" aria-label={`Create invite for ${ownerHousehold.name}`} disabled={inviteMutation.isPending}>
									{inviteMutation.isPending ? "Creating invite…" : "Create invite"}
								</Button>
							</form>
						) : <p className="mt-3 text-sm text-muted-foreground">Only a household owner can send invites.</p>}
						<form className="mt-6 grid gap-3 border-t border-border pt-5" onSubmit={submitAccept}>
							<label className="grid gap-2 text-sm font-bold" htmlFor="invite-token">
								Invite token
								<Input id="invite-token" value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} placeholder="Paste the one-time token" />
							</label>
							<Button type="submit" variant="outline" disabled={acceptMutation.isPending}>{acceptMutation.isPending ? "Accepting…" : "Accept invite"}</Button>
						</form>
					</Card>
				</section>
			</div>
		</main>
	);
};

export default HouseholdsPage;
