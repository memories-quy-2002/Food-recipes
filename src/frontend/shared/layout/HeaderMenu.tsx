import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import {
	isNavigationItemActive,
	type NavigationItem,
} from "./navigation";

export type HeaderMenuProps = {
	items: NavigationItem[];
};

const HeaderMenu = ({ items }: HeaderMenuProps): ReactElement => {
	const { pathname } = useLocation();
	return (
		<nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
			{items.map(({ title, href }) => {
				const active = isNavigationItemActive(pathname, href, items);
				return (
					<Link
						key={href}
						className={cn(
							"inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							active && "bg-accent text-accent-foreground",
						)}
						aria-current={active ? "page" : undefined}
						to={href}
					>
						{title}
					</Link>
				);
			})}
		</nav>
	);
};

export default HeaderMenu;
