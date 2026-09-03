import { useEffect, type ReactElement } from "react";

const SITE_NAME = "Food Recipes";
const DEFAULT_DESCRIPTION =
	"Discover, save, review, and share practical recipes for everyday cooking.";
const DEFAULT_IMAGE = "/food-recipes-social.svg";
const SITE_URL =
	import.meta.env.VITE_SITE_URL || "https://foodrecipes1.vercel.app";
const SEO_ATTRIBUTE = "data-food-recipes-seo";

type PageHelmetProps = {
	title?: string;
	description?: string;
	path?: string;
	type?: string;
	image?: string;
	noIndex?: boolean;
};

const appendMeta = (attributes: Record<string, string>): void => {
	const element = document.createElement("meta");
	element.setAttribute(SEO_ATTRIBUTE, "true");
	Object.entries(attributes).forEach(([name, value]) => {
		element.setAttribute(name, value);
	});
	document.head.appendChild(element);
};

const PageHelmet = ({
	title,
	description = DEFAULT_DESCRIPTION,
	path = "/",
	type = "website",
	image = DEFAULT_IMAGE,
	noIndex = false,
}: PageHelmetProps): ReactElement | null => {
	const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
	const canonicalUrl = `${SITE_URL}${path}`;

	useEffect(() => {
		document.title = pageTitle;
		document.head
			.querySelectorAll(`[${SEO_ATTRIBUTE}]`)
			.forEach((element) => element.remove());

		appendMeta({ name: "description", content: description });
		if (noIndex) {
			appendMeta({ name: "robots", content: "noindex,nofollow" });
		}

		appendMeta({ property: "og:site_name", content: SITE_NAME });
		appendMeta({ property: "og:type", content: type });
		appendMeta({ property: "og:title", content: pageTitle });
		appendMeta({ property: "og:description", content: description });
		appendMeta({ property: "og:url", content: canonicalUrl });
		appendMeta({ property: "og:image", content: image });
		appendMeta({ name: "twitter:card", content: "summary_large_image" });
		appendMeta({ name: "twitter:title", content: pageTitle });
		appendMeta({ name: "twitter:description", content: description });
		appendMeta({ name: "twitter:image", content: image });

		const canonicalLink = document.createElement("link");
		canonicalLink.setAttribute(SEO_ATTRIBUTE, "true");
		canonicalLink.setAttribute("rel", "canonical");
		canonicalLink.setAttribute("href", canonicalUrl);
		document.head.appendChild(canonicalLink);

		return () => {
			document.head
				.querySelectorAll(`[${SEO_ATTRIBUTE}]`)
				.forEach((element) => element.remove());
		};
	}, [canonicalUrl, description, image, noIndex, pageTitle, type]);

	return null;
};

export default PageHelmet;
