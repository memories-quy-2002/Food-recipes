import type { ImgHTMLAttributes, SyntheticEvent } from "react";
import defaultImage from "@/shared/assets/images/default_image.png";

const images = import.meta.glob<string>(
	`../assets/images/*.{png,jpg,jpeg,webp,svg}`,
	{
		eager: true,
		import: "default",
	},
);

const imageAliases: Record<string, string> = {
	cajun_seafood_pasta: "quick_shrimp_scampi",
	lunch_dinner: "lunch",
	lunch_and_dinner: "lunch",
	molten_chocolate_mug_cake: "desserts",
	vanilla_no_bake_cheesecake: "desserts",
};

const DEFAULT_IMAGE_WIDTH = 900;
const DEFAULT_IMAGE_HEIGHT = 600;
const RESPONSIVE_IMAGE_WIDTHS = [400, 800, 1200];

type ImageTransformOptions = {
	width?: number;
	height?: number;
	quality?: number;
};

export type ConvertImageOptions = ImageTransformOptions & {
	sizes?: string;
};

const isRemoteImage = (src: unknown): src is string =>
	typeof src === "string" &&
	(src.startsWith("http://") ||
		src.startsWith("https://") ||
		src.startsWith("data:") ||
		src.startsWith("blob:"));

const isHttpImage = (src: unknown): src is string =>
	typeof src === "string" &&
	(src.startsWith("http://") || src.startsWith("https://"));

const toPositiveInteger = (value: unknown, fallback: number): number => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function getOptimizedImageUrl(
	imageUrl: string,
	options?: ImageTransformOptions,
): string;
export function getOptimizedImageUrl(
	imageUrl: string | null | undefined,
	options?: ImageTransformOptions,
): string | null | undefined;
export function getOptimizedImageUrl(
	imageUrl: string | null | undefined,
	{
		width = DEFAULT_IMAGE_WIDTH,
		height,
		quality = 80,
	}: ImageTransformOptions = {},
): string | null | undefined {
	if (!isHttpImage(imageUrl)) return imageUrl;

	try {
		const url = new URL(imageUrl);
		const marker = "/storage/v1/object/public/";
		const markerIndex = url.pathname.indexOf(marker);
		if (
			markerIndex < 0 ||
			url.pathname.includes("/storage/v1/render/image/")
		) {
			return imageUrl;
		}

		const objectPath = url.pathname.slice(markerIndex + marker.length);
		const separatorIndex = objectPath.indexOf("/");
		if (separatorIndex < 1 || separatorIndex === objectPath.length - 1) {
			return imageUrl;
		}

		const bucket = objectPath.slice(0, separatorIndex);
		const path = objectPath.slice(separatorIndex + 1);
		const basePath = url.pathname.slice(0, markerIndex);
		url.pathname = `${basePath}/storage/v1/render/image/public/${bucket}/${path}`;
		url.searchParams.set(
			"width",
			String(toPositiveInteger(width, DEFAULT_IMAGE_WIDTH)),
		);
		url.searchParams.set("quality", String(toPositiveInteger(quality, 80)));
		if (height !== undefined) {
			url.searchParams.set(
				"height",
				String(toPositiveInteger(height, DEFAULT_IMAGE_HEIGHT)),
			);
			url.searchParams.set("resize", "cover");
		}

		return url.toString();
	} catch {
		return imageUrl;
	}
}

export const getResponsiveImageSrcSet = (
	imageUrl: string | null | undefined,
	{ height, quality = 80 }: ImageTransformOptions = {},
): string | undefined => {
	const optimizedImageUrl = getOptimizedImageUrl(imageUrl, {
		width: DEFAULT_IMAGE_WIDTH,
		height,
		quality,
	});
	if (optimizedImageUrl === imageUrl) return undefined;
	if (!optimizedImageUrl) return undefined;

	const aspectRatio = height ? height / DEFAULT_IMAGE_WIDTH : undefined;
	return RESPONSIVE_IMAGE_WIDTHS.map((width) => {
		const responsiveHeight = aspectRatio
			? Math.round(width * aspectRatio)
			: undefined;
		return `${getOptimizedImageUrl(imageUrl, {
			width,
			height: responsiveHeight,
			quality,
		})} ${width}w`;
	}).join(", ");
};

const normalizeImageName = (value = ""): string =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

const handleImageError = (event: SyntheticEvent<HTMLImageElement>): void => {
	const image = event.currentTarget;
	const originalSrc = image.dataset.originalSrc;
	if (originalSrc && image.dataset.originalFailed !== "true") {
		image.dataset.originalFailed = "true";
		image.removeAttribute("srcset");
		image.removeAttribute("sizes");
		image.src = originalSrc;
		return;
	}

	if (image.dataset.fallback === "true") return;

	image.dataset.fallback = "true";
	image.onerror = null;
	image.src = defaultImage;
};

const convertImage = (
	name = "Recipe image",
	className = "",
	imageUrl: string | null | undefined = "",
	{
		width = DEFAULT_IMAGE_WIDTH,
		height = DEFAULT_IMAGE_HEIGHT,
		quality = 80,
		sizes,
	}: ConvertImageOptions = {},
): React.ReactElement => {
	const imageProps: ImgHTMLAttributes<HTMLImageElement> = {
		alt: name[0].toUpperCase() + name.substring(1),
		className: `object-cover ${className}`,
		width,
		height,
		loading: "lazy",
		decoding: "async",
		onError: handleImageError,
	};

	if (isRemoteImage(imageUrl)) {
		const optimizedImageUrl = getOptimizedImageUrl(imageUrl, {
			width,
			height,
			quality,
		});
		const srcSet = getResponsiveImageSrcSet(imageUrl, { height, quality });
		return (
			<img
				{...imageProps}
				src={optimizedImageUrl}
				{...(srcSet
					? {
							srcSet,
							sizes:
								sizes ||
								"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 900px",
						}
					: {})}
				{...(optimizedImageUrl !== imageUrl
					? { "data-original-src": imageUrl }
					: {})}
			/>
		);
	}

	const normalizedName = normalizeImageName(name);
	const imageName = imageAliases[normalizedName] || normalizedName;

	const imageEntry = Object.entries(images).find(([path]) =>
		normalizeImageName(path.split("/").pop()?.split(".")[0]).includes(
			imageName,
		),
	);

	const imageSrc = imageEntry ? imageEntry[1] : defaultImage;

	return <img {...imageProps} src={imageSrc} />;
};

export default convertImage;
