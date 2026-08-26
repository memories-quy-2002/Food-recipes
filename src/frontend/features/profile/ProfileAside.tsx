import type { ReactElement } from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import Button from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";
import type { ProfilePage } from "./profileTypes";

export type ProfilePageItem = { link: ProfilePage; name: string };
type ProfileAsideProps = {
	name?: string | null;
	page: ProfilePage;
	handleLogOut: () => void | Promise<void>;
	handleChangePage: (page: ProfilePage) => void;
	profilePageList: ProfilePageItem[];
};

const ProfileAside = ({ name, page, handleLogOut, handleChangePage, profilePageList }: ProfileAsideProps): ReactElement => (
	<aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:sticky lg:top-24">
		<div className="flex items-center gap-3 border-b border-border bg-secondary/60 p-4 sm:p-5">
			<IoPersonCircleSharp className="size-12 shrink-0 text-primary sm:size-14" aria-hidden="true" />
			<div className="min-w-0">
				<p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your kitchen</p>
				<h2 className="truncate text-lg font-bold text-foreground">Hi, {name || "Cook"}</h2>
			</div>
		</div>
		<nav className="p-2" aria-label="Profile sections">
			<ul className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
				{profilePageList.map(({ link, name: label }) => (
					<li key={link || "personal-info"}>
						<Link
							to={`/profile#/${link}`}
							onClick={() => handleChangePage(link)}
							aria-current={page === link ? "page" : undefined}
							className={cn("flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", page === link && "bg-accent text-accent-foreground")}
						>
							{label}
						</Link>
					</li>
				))}
			</ul>
			<div className="mt-2 border-t border-border pt-2">
				<Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogOut}>Log out</Button>
			</div>
		</nav>
	</aside>
);
export default ProfileAside;
