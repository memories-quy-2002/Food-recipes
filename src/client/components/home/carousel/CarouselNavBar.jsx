import React from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

const CarouselNavBar = ({
	currIndex,
	items,
	onSpecSlide,
	onPrevSlide,
	onNextSlide,
}) => {
	return (
		<div className="home__carousel__nav">
			<button
				type="button"
				className="home__carousel__nav__arrow"
				onClick={onPrevSlide}
				aria-label="Previous featured slide"
			>
				<BsChevronLeft size={16} />
			</button>
			<div className="home__carousel__nav__button">
				{items.map(({ id, name }, index) => {
					return (
						<button
							type="button"
							className={`home__carousel__nav__dot${
								currIndex === index
									? " home__carousel__nav__dot--active"
									: ""
							}`}
							key={id || index}
							aria-label={`Show slide ${index + 1}: ${name}`}
							aria-current={currIndex === index}
							onClick={() => {
								onSpecSlide(index);
							}}
						/>
					);
				})}
			</div>
			<button
				type="button"
				className="home__carousel__nav__arrow"
				onClick={onNextSlide}
				aria-label="Next featured slide"
			>
				<BsChevronRight size={16} />
			</button>
		</div>
	);
};

export default CarouselNavBar;
