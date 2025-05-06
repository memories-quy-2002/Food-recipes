// imageLoader.js or utils/convertImage.js

// Import fallback/default image
import default_image from "../assets/images/default_image.png";
import React from "react";
// Load all images with common extensions
const images = import.meta.glob("../assets/images/*.{png,jpg,jpeg,webp,svg}", {
	eager: true,
	import: "default",
});

const convertImage = (name, className = "") => {
	const normalizedName = name.toLowerCase().replaceAll(" ", "_");

	const imageEntry = Object.entries(images).find(([path]) =>
		path.includes(`/assets/images/${normalizedName}.`)
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
