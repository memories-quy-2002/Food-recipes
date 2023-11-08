import default_image from "../assets/images/default_image.png";

const convertImage = (name, className = "") => {
	const imageName = name.toLowerCase().replaceAll(" ", "_");
	const checkImageExists = (imageName) => {
		try {
			require(`../assets/images/${imageName}.png`);
			return true;
		} catch (error) {
			return false;
		}
	};
	return (
		<img
			src={
				checkImageExists(imageName)
					? require(`../assets/images/${imageName}.png`)
					: default_image
			}
			alt={name[0].toUpperCase() + name.substring(1)}
			className={className}
		/>
	);
};

export default convertImage;
