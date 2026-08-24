export const getPrimaryNavigation = (isAuthenticated, isDevelopment = import.meta.env.DEV) => [
	{ title: "Home", href: "/" },
	{ title: "Recipes", href: "/food" },
	{ title: "Saved", href: "/wishlist" },
	...(isAuthenticated ? [{ title: "Planning", href: "/planning" }] : []),
	...(isAuthenticated ? [{ title: "Shopping", href: "/shopping-list" }] : []),
	...(isAuthenticated ? [{ title: "Add Recipe", href: "/food/add" }] : []),
	...(isDevelopment ? [{ title: "Health", href: "/health" }] : []),
];

export const isNavigationItemActive = (pathname, href, items) => {
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
