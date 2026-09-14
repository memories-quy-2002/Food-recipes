import { useEffect, type ReactElement } from 'react';

const SITE_NAME = 'Food Recipes';
const DEFAULT_DESCRIPTION =
	'Discover, save, review, and share practical recipes for everyday cooking.';
const DEFAULT_IMAGE = '/food-recipes-social.svg';
const SITE_URL =
	import.meta.env.VITE_SITE_URL || 'https://foodrecipes1.vercel.app';
const SEO_ATTRIBUTE = 'data-food-recipes-seo';
const JSON_LD_TYPE = 'application/ld+json';

type PageHelmetProps = {
	title?: string;
	description?: string;
	path?: string;
	type?: string;
	image?: string;
	noIndex?: boolean;
	structuredData?: Record<string, unknown> | null;
};

const appendMeta = (attributes: Record<string, string>): void => {
	const element = document.createElement('meta');
	element.setAttribute(SEO_ATTRIBUTE, 'true');
	Object.entries(attributes).forEach(([name, value]) => {
		element.setAttribute(name, value);
	});
	document.head.appendChild(element);
};

const getCanonicalUrl = (path: string): string => {
	try {
		return new URL(path, SITE_URL + '/').toString();
	} catch {
		return SITE_URL + path;
	}
};

const getAbsoluteUrl = (value: string): string => {
	try {
		return new URL(value, SITE_URL + '/').toString();
	} catch {
		return value;
	}
};

const PageHelmet = ({
	title,
	description = DEFAULT_DESCRIPTION,
	path = '/',
	type = 'website',
	image = DEFAULT_IMAGE,
	noIndex = false,
	structuredData = null,
}: PageHelmetProps): ReactElement | null => {
	const pageTitle = title ? title + ' | ' + SITE_NAME : SITE_NAME;
	const canonicalUrl = getCanonicalUrl(path);
	const absoluteImage = getAbsoluteUrl(image);

	useEffect(() => {
		document.title = pageTitle;
		document.head
			.querySelectorAll('[' + SEO_ATTRIBUTE + ']')
			.forEach((element) => element.remove());

		appendMeta({ name: 'description', content: description });

		const robotsMeta = document.head.querySelector<HTMLMetaElement>(
			'meta[name=robots]:not([' + SEO_ATTRIBUTE + '])',
		);
		const originalRobotsContent = robotsMeta?.getAttribute('content');
		const managedRobotsMeta = robotsMeta ?? document.createElement('meta');
		if (!robotsMeta) {
			managedRobotsMeta.setAttribute('name', 'robots');
			managedRobotsMeta.setAttribute(SEO_ATTRIBUTE, 'true');
			document.head.appendChild(managedRobotsMeta);
		}
		managedRobotsMeta.setAttribute(
			'content',
			noIndex ? 'noindex,nofollow' : 'index,follow',
		);

		appendMeta({ property: 'og:site_name', content: SITE_NAME });
		appendMeta({ property: 'og:type', content: type });
		appendMeta({ property: 'og:title', content: pageTitle });
		appendMeta({ property: 'og:description', content: description });
		appendMeta({ property: 'og:url', content: canonicalUrl });
		appendMeta({ property: 'og:image', content: absoluteImage });
		appendMeta({ name: 'twitter:card', content: 'summary_large_image' });
		appendMeta({ name: 'twitter:title', content: pageTitle });
		appendMeta({ name: 'twitter:description', content: description });
		appendMeta({ name: 'twitter:image', content: absoluteImage });

		if (structuredData) {
			const jsonLd = document.createElement('script');
			jsonLd.setAttribute('type', JSON_LD_TYPE);
			jsonLd.setAttribute(SEO_ATTRIBUTE, 'true');
			jsonLd.textContent = JSON.stringify(structuredData);
			document.head.appendChild(jsonLd);
		}

		const canonicalLink = document.createElement('link');
		canonicalLink.setAttribute(SEO_ATTRIBUTE, 'true');
		canonicalLink.setAttribute('rel', 'canonical');
		canonicalLink.setAttribute('href', canonicalUrl);
		document.head.appendChild(canonicalLink);

		return () => {
			document.head
				.querySelectorAll('[' + SEO_ATTRIBUTE + ']')
				.forEach((element) => element.remove());
			if (robotsMeta && originalRobotsContent !== null && originalRobotsContent !== undefined) {
				robotsMeta.setAttribute('content', originalRobotsContent);
			}
		};
	}, [absoluteImage, canonicalUrl, description, noIndex, pageTitle, structuredData, type]);

	return null;
};

export default PageHelmet;
