import React, { useEffect, useState } from "react";
import Slide from "./Slide";
import SlideShowNav from "./SlideShowNav";

const SlideShow = ({ items }) => {
	const [currIndex, setCurrIndex] = useState(0);
	const handleNextSlide = () => {
		setCurrIndex((prevIndex) => (prevIndex + 1) % items.length);
	};

	const handlePrevSlide = () => {
		setCurrIndex((prevIndex) => (prevIndex - 1) % items.length);
	};

	const handleSpecSlide = (id) => {
		setCurrIndex(id - 1);
	};

	useEffect(() => {
		const intervalId = setInterval(handleNextSlide, 10000);
		return () => {
			clearInterval(intervalId);
		};
	}, []);

	return (
		<div className="home__slideshow">
			<div
				className="home__slideshow__container"
				style={{
					transition: `transform 0.3s ease-in-out`,
					transform: `translateX(-${currIndex * 100}vw)`,
				}}
			>
				{items.map(({ id, title, desc, imgSrc }) => (
					<Slide
						key={id}
						id={id}
						title={title}
						desc={desc}
						imgSrc={imgSrc}
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
