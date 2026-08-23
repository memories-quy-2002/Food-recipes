import React from "react";
import { Helmet } from "react-helmet";

const SITE_NAME = "Food Recipes";
const DEFAULT_DESCRIPTION =
	"Discover, save, review, and share practical recipes for everyday cooking.";
const DEFAULT_IMAGE = "/hamburger.svg";
const SITE_URL =
	import.meta.env.VITE_SITE_URL || "https://foodrecipes1.vercel.app";

const PageHelmet = ({
	title,
	description = DEFAULT_DESCRIPTION,
	path = "/",
	type = "website",
	image = DEFAULT_IMAGE,
	noIndex = false,
}) => {
	const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
	const canonicalUrl = `${SITE_URL}${path}`;

	return (
		<Helmet>
			<title>{pageTitle}</title>
			<meta name="description" content={description} />
			<link rel="canonical" href={canonicalUrl} />
			{noIndex && <meta name="robots" content="noindex,nofollow" />}

			<meta property="og:site_name" content={SITE_NAME} />
			<meta property="og:type" content={type} />
			<meta property="og:title" content={pageTitle} />
			<meta property="og:description" content={description} />
			<meta property="og:url" content={canonicalUrl} />
			<meta property="og:image" content={image} />

			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={pageTitle} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={image} />
		</Helmet>
	);
};

export default PageHelmet;
