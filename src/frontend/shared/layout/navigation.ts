export type NavigationItem = {
	title: string;
	href: string;
};

export type NavigationGroup = {
	label: string;
	items: NavigationItem[];
};

export const getPrimaryNavigation = (
	isAuthenticated: boolean,
): NavigationItem[] => [
	{ title: "Recipes", href: "/food" },
	{ title: "Saved", href: "/wishlist" },
	...(isAuthenticated ? [{ title: "Plan", href: "/planning" }] : []),
];

export const getMoreNavigation = (
	isAuthenticated: boolean,
	isDevelopment = import.meta.env.DEV,
): NavigationGroup[] => {
	if (!isAuthenticated) return [];

	const groups: NavigationGroup[] = [
		{
			label: "Kitchen",
			items: [
				{ title: "Shopping list", href: "/shopping-list" },
				{ title: "Cooking history", href: "/history" },
			],
		},
		{
			label: "Recipes",
			items: [{ title: "Import recipe", href: "/recipes/import" }],
		},
		{
			label: "Account",
			items: [
				{ title: "Preferences", href: "/profile/preferences" },
				{ title: "Households", href: "/households" },
				{ title: "Notifications", href: "/profile/notifications" },
			],
		},
	];

	if (isDevelopment) {
		groups.push({
			label: "Developer",
			items: [{ title: "Health", href: "/health" }],
		});
	}

	return groups;
};

export const getRecipeAction = (
	isAuthenticated: boolean,
): NavigationItem | undefined =>
	isAuthenticated ? { title: "Add recipe", href: "/food/add" } : undefined;

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
