import React from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "../../../utils/convertImage";
const CarouselItem = ({ id, title, desc, imgSrc }) => {
	const navigate = useNavigate();
	const handleClick = () => {
		navigate(`/food?meal=${id}`);
	};
	return (
		<div className="home__carousel__item">
			<div className="home__carousel__item__content">
				<h1 className="home__carousel__item__content__title">
					{title}
				</h1>
				<p className="home__carousel__item__content__desc">{desc}</p>
				<button
					type="button"
					className="home__carousel__item__content__button btn btn-dark"
					onClick={handleClick}
				>
					Learn more
				</button>
			</div>
			{convertImage(imgSrc, "home__carousel__item__img")}
		</div>
	);
};

export default CarouselItem;
