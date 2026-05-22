import React from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "../../../utils/convertImage";
const CarouselItem = ({ id, title, desc, imgSrc, index, total }) => {
	const navigate = useNavigate();
	const handleClick = () => {
		navigate(id ? `/food?meals=${id}` : "/food");
	};
	const handleBrowseAll = () => {
		navigate("/food");
	};
	return (
		<div className="home__carousel__item">
			<div className="home__carousel__item__content">
				<span className="home__carousel__item__content__count">
					{String(index + 1).padStart(2, "0")} /{" "}
					{String(total).padStart(2, "0")}
				</span>
				<h1 className="home__carousel__item__content__title">
					{title}
				</h1>
				<p className="home__carousel__item__content__desc">{desc}</p>
				<div className="home__carousel__item__content__actions">
					<button
						type="button"
						className="home__carousel__item__content__button btn btn-dark"
						onClick={handleClick}
					>
						Explore this meal
					</button>
					<button
						type="button"
						className="home__carousel__item__content__button home__carousel__item__content__button--ghost"
						onClick={handleBrowseAll}
					>
						Browse all
					</button>
				</div>
			</div>
			<div className="home__carousel__item__media">
				{convertImage(imgSrc, "home__carousel__item__img")}
			</div>
		</div>
	);
};

export default CarouselItem;
