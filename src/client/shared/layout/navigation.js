export const getPrimaryNavigation = (isAuthenticated, isDevelopment = import.meta.env.DEV) => [
	{ title: "Home", href: "/" },
	{ title: "Recipes", href: "/food" },
	{ title: "Saved", href: "/wishlist" },
	...(isAuthenticated ? [{ title: "Add Recipe", href: "/food/add" }] : []),
	...(isDevelopment ? [{ title: "Health", href: "/health" }] : []),
];
