import React, { useEffect, useState } from "react";
import CarouselItem from "./carousel/CarouselItem";
import CarouselNavBar from "./carousel/CarouselNavBar";
const Carousel = ({ items }) => {
	const [currIndex, setCurrIndex] = useState(0);

	const handleSpecSlide = (id) => {
		setCurrIndex(id - 1);
	};

	useEffect(() => {
		const intervalId = setInterval(() => {
			setCurrIndex((prevIndex) => (prevIndex + 1) % items.length);
		}, 10000);
		return () => {
			clearInterval(intervalId);
		};
	}, [items.length]);
	return (
		<div className="home__carousel">
			<div
				className="home__carousel__container"
				style={{
					transition: `transform 1s ease-in-out`,
					transform: `translateX(-${currIndex * 100}vw)`,
				}}
			>
				{items &&
					items.map(({ id, name, description }) => (
						<CarouselItem
							key={id}
							id={id}
							title={name}
							desc={description}
							imgSrc={name}
						/>
					))}
			</div>

			<CarouselNavBar
				currIndex={currIndex}
				items={items}
				onSpecSlide={handleSpecSlide}
			/>
		</div>
	);
};

export default Carousel;
