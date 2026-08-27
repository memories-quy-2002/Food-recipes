import { useEffect, useState, type ReactElement } from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import {
	BookOpen,
	ChevronDown,
	KeyRound,
	LayoutDashboard,
	LogOut,
	MessageSquareText,
	UserRound,
	type LucideIcon,
} from "lucide-react";
import Button from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";
import type { ProfilePage } from "./profileTypes";

type ProfileAsideProps = {
	name?: string | null;
	page: ProfilePage;
	handleLogOut: () => void | Promise<void>;
	handleChangePage: (page: ProfilePage) => void;
};

type ProfileNavigationItem = {
	link: Exclude<ProfilePage, "overview">;
	name: string;
	icon: LucideIcon;
};

const profileNavigationSections: Array<{
	name: string;
	items: ProfileNavigationItem[];
}> = [
	{
		name: "Account",
		items: [
			{ link: "personal-info", name: "Personal info", icon: UserRound },
			{ link: "password", name: "Change password", icon: KeyRound },
		],
	},
	{
		name: "Your content",
		items: [
			{ link: "recipes", name: "My recipes", icon: BookOpen },
			{ link: "reviews", name: "My reviews", icon: MessageSquareText },
		],
	},
];

const profilePageLabels: Record<ProfilePage, string> = {
	overview: "Overview",
	"personal-info": "Personal info",
	password: "Change password",
	recipes: "My recipes",
	reviews: "My reviews",
};

const navigationLinkClass = (isActive: boolean): string =>
	cn(
		"flex min-h-11 items-center gap-3 rounded-xl border-l-2 border-transparent px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/60 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		isActive && "border-primary bg-accent/35 text-foreground shadow-sm",
	);

const ProfileAside = ({
	name,
	page,
	handleLogOut,
	handleChangePage,
}: ProfileAsideProps): ReactElement => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const currentLabel = profilePageLabels[page];

	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [page]);

	const handleNavigate = (nextPage: ProfilePage): void => {
		handleChangePage(nextPage);
		setIsMobileMenuOpen(false);
	};

	return (
		<aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:sticky lg:top-24">
			<div className="flex items-center gap-3 border-b border-border bg-secondary/60 p-3 sm:p-5">
				<IoPersonCircleSharp className="size-11 shrink-0 text-primary sm:size-14" aria-hidden="true" />
				<div className="min-w-0">
					<p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
						Profile
					</p>
					<h2 className="truncate text-lg font-bold text-foreground">Hi, {name || "Cook"}</h2>
				</div>
			</div>

			<div className="border-b border-border p-3 lg:hidden">
				<button
					type="button"
					className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-expanded={isMobileMenuOpen}
					aria-controls="profile-section-menu"
					onClick={() => setIsMobileMenuOpen((current) => !current)}
				>
					<span className="min-w-0">
						<span className="block font-sans text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Profile menu</span>
						<span className="mt-0.5 block truncate text-sm font-bold text-foreground">{currentLabel}</span>
					</span>
					<ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isMobileMenuOpen && "rotate-180")} aria-hidden="true" />
				</button>
			</div>

			<nav id="profile-section-menu" className={cn("p-2", isMobileMenuOpen ? "block" : "hidden", "lg:block")} aria-label="Profile sections">
				<ul className="grid gap-3 lg:gap-4">
					<li>
						<Link
							to="/profile"
							onClick={() => handleNavigate("overview")}
							aria-current={page === "overview" ? "page" : undefined}
							className={navigationLinkClass(page === "overview")}
						>
							<LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
							<span>Overview</span>
						</Link>
					</li>
					{profileNavigationSections.map(({ name: sectionName, items }) => (
						<li key={sectionName}>
							<h3 className="px-3 pb-1 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
								{sectionName}
							</h3>
							<ul className="grid gap-1">
								{items.map(({ link, name: label, icon: Icon }) => (
									<li key={link}>
										<Link
											to={`/profile#/${link}`}
											onClick={() => handleNavigate(link)}
											aria-current={page === link ? "page" : undefined}
											className={navigationLinkClass(page === link)}
										>
											<Icon className="size-4 shrink-0" aria-hidden="true" />
											<span>{label}</span>
										</Link>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</nav>

			<div className="border-t border-border p-2">
				<Button
					variant="ghost"
					className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
					onClick={handleLogOut}
				>
					<LogOut className="size-4" aria-hidden="true" />
					Log out
				</Button>
			</div>
		</aside>
	);
};
export default ProfileAside;
