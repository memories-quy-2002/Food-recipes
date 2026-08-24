// Import fallback/default image
import default_image from "@/shared/assets/images/default_image.png";

// Load all images with common extensions
const images = import.meta.glob(`../assets/images/*.{png,jpg,jpeg,webp,svg}`, {
	eager: true,
	import: "default",
});

const imageAliases = {
	cajun_seafood_pasta: "quick_shrimp_scampi",
	molten_chocolate_mug_cake: "desserts",
	vanilla_no_bake_cheesecake: "desserts",
};

const isRemoteImage = (src) =>
	typeof src === "string" &&
	(src.startsWith("http://") ||
		src.startsWith("https://") ||
		src.startsWith("data:") ||
		src.startsWith("blob:"));

const normalizeImageName = (value = "") =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

const handleImageError = (event) => {
	const image = event.currentTarget;
	if (image.dataset.fallback === "true") return;

	image.dataset.fallback = "true";
	image.onerror = null;
	image.src = default_image;
};

const convertImage = (name = "Recipe image", className = "", imageUrl = "") => {
	const imageProps = {
		alt: name[0].toUpperCase() + name.substring(1),
		className: `object-cover ${className}`,
		width: 900,
		height: 600,
		loading: "lazy",
		decoding: "async",
		onError: handleImageError,
	};

	if (isRemoteImage(imageUrl)) {
		return <img {...imageProps} src={imageUrl} />;
	}

	const normalizedName = normalizeImageName(name);
	const imageName = imageAliases[normalizedName] || normalizedName;

	const imageEntry = Object.entries(images).find(([path]) =>
		normalizeImageName(path.split("/").pop()?.split(".")[0]).includes(
			imageName
		)
	);

	const imageSrc = imageEntry ? imageEntry[1] : default_image;

	return <img {...imageProps} src={imageSrc} />;
};


export default convertImage;
