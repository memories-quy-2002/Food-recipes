import React, { useEffect, useState } from "react";
import Slide from "./Slide";
import SlideShowNav from "./SlideShowNav";

const SlideShow = ({ items }) => {
	const [currIndex, setCurrIndex] = useState(0);
	const handleNextSlide = () => {
		setCurrIndex((prevIndex) => (prevIndex + 1) % items.length);
	};

	const handlePrevSlide = () => {
		setCurrIndex(
			(prevIndex) => (prevIndex - 1 + items.length) % items.length
		);
	};

	const handleSpecSlide = (id) => {
		setCurrIndex(id);
	};
	useEffect(() => {
		const intervalId = setInterval(() => {
			setCurrIndex((prevIndex) => (prevIndex + 1) % items.length);
		}, 8000);
		return () => {
			clearInterval(intervalId);
		};
	}, [items.length]);
	return (
		<div className="home__slideshow">
			<div
				className="home__slideshow__container"
				style={{
					transition: `transform 0.3s ease-in-out`,
					transform: `translateX(-${currIndex * 100}vw)`,
				}}
			>
				{items &&
					items.map(({ id, name, description }) => (
						<Slide
							key={id}
							id={id}
							title={name}
							desc={description}
							imgSrc={name}
						/>
					))}
			</div>

			<SlideShowNav
				currIndex={currIndex}
				items={items}
				onPrevSlide={handlePrevSlide}
				onSpecSlide={handleSpecSlide}
				onNextSlide={handleNextSlide}
			/>
		</div>
	);
};

export default SlideShow;
