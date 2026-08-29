import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark, BookOpen, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
	isNavigationItemActive,
	type NavigationGroup,
	type NavigationItem,
} from "./navigation";
import HeaderMoreMenu from "./HeaderMoreMenu";

export type HeaderMenuProps = {
	items: NavigationItem[];
	moreGroups?: NavigationGroup[];
	action?: NavigationItem;
};

const navigationIcons = {
	Recipes: BookOpen,
	Saved: Bookmark,
	Plan: CalendarDays,
};

const HeaderMenu = ({ items, moreGroups = [], action }: HeaderMenuProps): ReactElement => {
	const { pathname } = useLocation();
	const activeItems = action ? [...items, action] : items;
	return (
		<nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label="Primary navigation">
			<div className="flex items-center gap-0.5">
			{items.map(({ title, href }) => {
				const active = isNavigationItemActive(pathname, href, activeItems);
				const Icon = navigationIcons[title as keyof typeof navigationIcons] ?? BookOpen;
				return (
					<Link
						key={href}
						className={cn(
							"inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							active && "bg-muted text-foreground",
						)}
						aria-current={active ? "page" : undefined}
						aria-label={title}
						title={title}
						to={href}
					>
						<Icon className="size-4" aria-hidden="true" />
						{title}
					</Link>
				);
			})}
			</div>
			<HeaderMoreMenu groups={moreGroups} />
			{action && (
				<Link
					className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-current={isNavigationItemActive(pathname, action.href, activeItems) ? "page" : undefined}
					aria-label={action.title}
					title={action.title}
					to={action.href}
				>
					<Plus className="size-4" aria-hidden="true" />
					{action.title}
				</Link>
			)}
		</nav>
	);
};

export default HeaderMenu;
