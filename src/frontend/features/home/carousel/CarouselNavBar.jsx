import React from "react";
import {
	BsChevronLeft,
	BsChevronRight,
	BsPauseFill,
	BsPlayFill,
} from "react-icons/bs";

const CarouselNavBar = ({
	currIndex,
	items,
	onSpecSlide,
	onPrevSlide,
	onNextSlide,
	isPaused,
	onTogglePause,
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
			<button
				type="button"
				className="home__carousel__nav__pause"
				onClick={onTogglePause}
				aria-label={isPaused ? "Resume featured carousel" : "Pause featured carousel"}
			>
				{isPaused ? <BsPlayFill size={15} /> : <BsPauseFill size={15} />}
			</button>
		</div>
	);
};

export default CarouselNavBar;
