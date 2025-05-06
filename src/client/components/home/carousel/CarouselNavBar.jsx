import React from "react";
import { BsCircle, BsCircleFill } from "react-icons/bs";
const CarouselNavBar = ({ currIndex, items, onSpecSlide }) => {
	return (
		<div className="home__carousel__nav">
			<div className="home__carousel__nav__button">
				{items.map(({ id }) => {
					return (
						<button
							type="button"
							key={id}
							onClick={() => {
								onSpecSlide(id);
							}}
						>
							{currIndex + 1 === id ? (
								<BsCircleFill size={12} color="orange" />
							) : (
								<BsCircle size={12} color="orange" />
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default CarouselNavBar;
