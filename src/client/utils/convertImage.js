import default_image from "../assets/images/default_image.png";

const convertImage = (name, className) => {
	const checkImageExists = (name) => {
		try {
			require(`../assets/images/${name
				.toLowerCase()
				.replace(" ", "_")}.png`);
			return true;
		} catch (error) {
			return false;
		}
	};
	return (
		<img
			src={
				checkImageExists(name)
					? require(`../assets/images/${name
							.toLowerCase()
							.replace(" ", "_")}.png`)
					: default_image
			}
			alt={name[0].toUpperCase() + name.substring(1)}
			className={className}
		/>
	);
};

export default convertImage;
