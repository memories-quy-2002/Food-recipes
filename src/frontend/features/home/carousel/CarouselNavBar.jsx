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
	showPauseControl = true,
}) => {
	return (
		<div className="home__carousel__nav" aria-label="Featured meal controls">
			<button
				type="button"
				className="home__carousel__nav__arrow"
				onClick={onPrevSlide}
				aria-label="Previous featured slide"
			>
				<BsChevronLeft size={16} aria-hidden="true" />
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
							aria-current={currIndex === index ? "true" : undefined}
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
				<BsChevronRight size={16} aria-hidden="true" />
			</button>
			{showPauseControl && (
				<button
					type="button"
					className="home__carousel__nav__pause"
					onClick={onTogglePause}
					aria-label={
						isPaused ? "Resume featured carousel" : "Pause featured carousel"
					}
					aria-pressed={isPaused}
				>
					{isPaused ? (
						<BsPlayFill size={15} aria-hidden="true" />
					) : (
						<BsPauseFill size={15} aria-hidden="true" />
					)}
				</button>
			)}
		</div>
	);
};

export default CarouselNavBar;
