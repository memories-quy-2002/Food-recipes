import React from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "../../../utils/convertImage";
const CarouselItem = ({ id, title, desc, imgSrc }) => {
	const navigate = useNavigate();
	const handleClick = () => {
		navigate(id ? `/food?meals=${id}` : "/food");
	};
	return (
		<div className="home__carousel__item">
			<div className="home__carousel__item__content">
				<span className="home__carousel__item__content__eyebrow">
					Fresh inspiration
				</span>
				<h1 className="home__carousel__item__content__title">
					{title}
				</h1>
				<p className="home__carousel__item__content__desc">{desc}</p>
				<button
					type="button"
					className="home__carousel__item__content__button btn btn-dark"
					onClick={handleClick}
				>
					Explore recipes
				</button>
			</div>
			<div className="home__carousel__item__media">
				{convertImage(imgSrc, "home__carousel__item__img")}
			</div>
		</div>
	);
};

export default CarouselItem;
