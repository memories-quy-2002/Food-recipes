const convertImage = (name, className) => {
	return (
		<img
			src={require(`../assets/images/${name
				.toLowerCase()
				.replace(" ", "_")}.png`)}
			alt={name[0].toUpperCase() + name.substring(1)}
			className={className}
		/>
	);
};

export default convertImage;
