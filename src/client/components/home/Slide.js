import React from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "../../utils/convertImage";
const Slide = ({ id, title, desc, imgSrc }) => {
	const navigate = useNavigate();
	const handleClick = () => {
		navigate(`/food?meal=${id}`);
	};
	return (
		<div className={`home__slide`}>
			<div className={`home__slide__content `}>
				<h1 className="home__slide__content__title">{title}</h1>
				<p className="home__slide__content__desc">{desc}</p>
				<button
					type="button"
					className="home__slide__content__button btn btn-dark"
					onClick={handleClick}
				>
					Learn more
				</button>
			</div>
			{convertImage(imgSrc, "home__slide__img")}
		</div>
	);
};

export default Slide;
