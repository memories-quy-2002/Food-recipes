import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	Activity,
	BookOpen,
	CalendarDays,
	Clock3,
	House,
	Plus,
	ShoppingBasket,
	Star,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
	isNavigationItemActive,
	type NavigationItem,
} from "./navigation";

export type HeaderMenuProps = {
	items: NavigationItem[];
};

const navigationIcons: Record<string, LucideIcon> = {
	Home: House,
	Recipes: BookOpen,
	Saved: Star,
	Planning: CalendarDays,
	Shopping: ShoppingBasket,
	History: Clock3,
	"Add Recipe": Plus,
	Health: Activity,
};

const HeaderMenu = ({ items }: HeaderMenuProps): ReactElement => {
	const { pathname } = useLocation();
	return (
		<nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
			{items.map(({ title, href }) => {
				const active = isNavigationItemActive(pathname, href, items);
				const Icon = navigationIcons[title] ?? BookOpen;
				return (
					<Link
						key={href}
						className={cn(
							"inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							active && "bg-accent text-accent-foreground",
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
		</nav>
	);
};

export default HeaderMenu;
