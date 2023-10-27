import React from "react";
import { useNavigate } from "react-router-dom";
const Slide = ({ id, title, desc, imgSrc }) => {
	const navigate = useNavigate();
	const handleClick = () => {
		navigate(`/meal?id=${id}`);
	};
	return (
		<div className={`home__slide`}>
			<div className={`home__slide__content `}>
				<h1 className="home__slide__content__title">{title}</h1>
				<p className="home__slide__content__desc">{desc}</p>
				<button
					type="button"
					className="home__slide__content__button"
					onClick={handleClick}
				>
					Learn more
				</button>
			</div>
			<img
				className="home__slide__img"
				src={require(`../../assets/images/${imgSrc.toLowerCase()}.png`)}
				alt={title}
			/>
		</div>
	);
};

export default Slide;
