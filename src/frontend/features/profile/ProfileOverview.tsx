import type { ReactElement } from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import type { ProfileUser } from "./profileTypes";

type ProfileOverviewProps = {
	user: ProfileUser | null | undefined;
};

const kitchenLinks = [
	{
		label: "My recipes",
		description: "Manage drafts, published recipes, and archived recipes.",
		to: "/profile#/recipes",
	},
	{
		label: "My reviews",
		description: "Revisit ratings and written notes.",
		to: "/profile#/reviews",
	},
	{
		label: "Saved recipes",
		description: "Open recipes you saved for later.",
		to: "/wishlist",
	},
	{
		label: "Meal planning",
		description: "Organize recipes for the week.",
		to: "/planning",
	},
	{
		label: "Cooking history",
		description: "Review recipes you have cooked.",
		to: "/history",
	},
] as const;

const ProfileOverview = ({ user }: ProfileOverviewProps): ReactElement => {
	const displayName = user?.full_name?.trim() || "Cook";
	const email = user?.email?.trim();

	return (
		<div className="grid gap-6">
			<header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Your kitchen
					</p>
					<h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
						Welcome back, {displayName}
					</h1>
					<p className="mt-2 max-w-2xl text-muted-foreground">
						Manage your account and continue building your kitchen.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button asChild>
						<Link to="/food/add">Add a recipe</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/wishlist">View saved recipes</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/recipes/import">Import from URL</Link>
					</Button>
				</div>
			</header>

			<Card className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
				<div className="flex min-w-0 items-center gap-4">
					<IoPersonCircleSharp
						className="size-14 shrink-0 text-primary"
						aria-hidden="true"
					/>
					<div className="min-w-0">
						<h2 className="text-xl font-bold">Account summary</h2>
						<p className="truncate font-semibold">{displayName}</p>
						{email ? (
							<p className="truncate text-sm text-muted-foreground">{email}</p>
						) : null}
					</div>
				</div>
				<div className="flex flex-wrap gap-2 sm:justify-end">
					<Button asChild variant="outline" size="sm">
						<Link to="/profile#/personal-info">Edit personal info</Link>
					</Button>
					<Button asChild variant="ghost" size="sm">
						<Link to="/profile#/password">Change password</Link>
					</Button>
				</div>
			</Card>

			<section aria-labelledby="kitchen-links-title">
				<h2 id="kitchen-links-title" className="text-2xl font-bold">
					Your kitchen
				</h2>
				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					{kitchenLinks.map(({ label, description, to }) => (
						<Card
							as="article"
							key={to}
							className="p-0 transition-colors hover:border-primary/60"
						>
							<Link
								to={to}
								className="block rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<h3 className="font-bold">{label}</h3>
								<p className="mt-1 text-sm leading-6 text-muted-foreground">
									{description}
								</p>
							</Link>
						</Card>
					))}
				</div>
			</section>
		</div>
	);
};

export default ProfileOverview;
