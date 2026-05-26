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

const convertImage = (name = "Recipe image", className = "", imageUrl = "") => {
	if (isRemoteImage(imageUrl)) {
		return (
			<img
				src={imageUrl}
				alt={name[0].toUpperCase() + name.substring(1)}
				className={`object-cover ${className}`}
				loading="lazy"
				decoding="async"
			/>
		);
	}

	const normalizedName = normalizeImageName(name);
	const imageName = imageAliases[normalizedName] || normalizedName;

	const imageEntry = Object.entries(images).find(([path]) =>
		normalizeImageName(path.split("/").pop()?.split(".")[0]).includes(
			imageName
		)
	);

	const imageSrc = imageEntry ? imageEntry[1] : default_image;

	return (
		<img
			src={imageSrc}
			alt={name[0].toUpperCase() + name.substring(1)}
			className={`object-cover ${className}`}
			loading="lazy"
			decoding="async"
		/>
	);
};


export default convertImage;
