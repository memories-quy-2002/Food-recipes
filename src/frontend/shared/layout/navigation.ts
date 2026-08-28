export type NavigationItem = {
	title: string;
	href: string;
};

export const getPrimaryNavigation = (
	isAuthenticated: boolean,
	isDevelopment = import.meta.env.DEV,
): NavigationItem[] => [
	{ title: "Home", href: "/" },
	{ title: "Recipes", href: "/food" },
	{ title: "Saved", href: "/wishlist" },
	...(isAuthenticated ? [{ title: "Planning", href: "/planning" }] : []),
	...(isAuthenticated ? [{ title: "Shopping", href: "/shopping-list" }] : []),
	...(isAuthenticated ? [{ title: "History", href: "/history" }] : []),
	...(isAuthenticated ? [{ title: "Preferences", href: "/profile/preferences" }] : []),
	...(isAuthenticated ? [{ title: "Households", href: "/households" }] : []),
	...(isAuthenticated ? [{ title: "Add Recipe", href: "/food/add" }] : []),
	...(isDevelopment ? [{ title: "Health", href: "/health" }] : []),
];

export const isNavigationItemActive = (
	pathname: string,
	href: string,
	items: NavigationItem[],
): boolean => {
	const normalizedPathname = pathname.replace(/\/$/, "") || "/";
	const matchingItems = items.filter(({ href: itemHref }) => {
		const normalizedHref = itemHref.replace(/\/$/, "") || "/";
		return normalizedHref === "/"
			? normalizedPathname === "/"
			: normalizedPathname === normalizedHref ||
					normalizedPathname.startsWith(`${normalizedHref}/`);
	});

	const mostSpecificHref = matchingItems
		.sort((left, right) => right.href.length - left.href.length)
		.at(0)?.href;

	return mostSpecificHref === href;
};
