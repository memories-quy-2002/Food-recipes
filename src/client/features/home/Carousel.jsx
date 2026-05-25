import React, { useEffect, useState } from "react";
import CarouselItem from "./carousel/CarouselItem";
import CarouselNavBar from "./carousel/CarouselNavBar";

const fallbackItems = [
	{
		id: null,
		name: "Cook something memorable",
		description:
			"Discover comforting meals, quick weeknight ideas, and fresh dishes for every table.",
		imageName: "main",
	},
];

const Carousel = ({ items }) => {
	const [currIndex, setCurrIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const displayItems = items.length ? items : fallbackItems;

	const handleSpecSlide = (index) => {
		setCurrIndex(index);
	};

	const handlePrevSlide = () => {
		setCurrIndex(
			(prevIndex) =>
				(prevIndex - 1 + displayItems.length) % displayItems.length
		);
	};

	const handleNextSlide = () => {
		setCurrIndex((prevIndex) => (prevIndex + 1) % displayItems.length);
	};

	useEffect(() => {
		if (currIndex >= displayItems.length) {
			setCurrIndex(0);
		}
	}, [currIndex, displayItems.length]);

	useEffect(() => {
		if (!displayItems.length || isPaused) return undefined;

		const intervalId = setInterval(() => {
			setCurrIndex((prevIndex) => (prevIndex + 1) % displayItems.length);
		}, 10000);
		return () => {
			clearInterval(intervalId);
		};
	}, [displayItems.length, isPaused]);
	return (
		<div
			className="home__carousel"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
		>
			<div
				className="home__carousel__container"
				style={{
					transition: `transform 1s ease-in-out`,
					transform: `translateX(-${currIndex * 100}vw)`,
				}}
			>
				{displayItems.map(({ id, name, description, imageName }, index) => (
						<CarouselItem
							key={id || index}
							id={id}
							title={name}
							desc={description}
							imgSrc={imageName || name}
							index={index}
							total={displayItems.length}
						/>
					))}
			</div>

			{displayItems.length > 1 && (
				<CarouselNavBar
					currIndex={currIndex}
					items={displayItems}
					onSpecSlide={handleSpecSlide}
					onPrevSlide={handlePrevSlide}
					onNextSlide={handleNextSlide}
					isPaused={isPaused}
					onTogglePause={() => setIsPaused((value) => !value)}
				/>
			)}
		</div>
	);
};

export default Carousel;
