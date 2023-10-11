import React, { useEffect, useState } from "react";
import Slide from "./Slide";

const items = [
	{
		id: 1,
		imgSrc: "breakfast",
		title: "Breakfast",
		desc: "Breakfast is the most important meal of the day. It provides your body with the energy it needs to start the day off right. Skipping breakfast can lead to a number of problems, including fatigue, difficulty concentrating, and overeating later in the day.",
	},
	{
		id: 2,
		imgSrc: "lunch",
		title: "Lunch",
		desc: "Lunch food is the most important meal of the day. It gives you the energy you need to power through the afternoon and helps you stay focused and productive. But with so many different lunch options available, it can be tough to know what to choose",
	},
	{
		id: 3,
		imgSrc: "dinner",
		title: "Dinner",
		desc: "Dinner is the most important meal of the day, and it's important to make sure you're eating something healthy and satisfying",
	},
	{
		id: 4,
		imgSrc: "desert",
		title: "Desert",
		desc: "Desert food is often associated with indulgence and unhealthy eating, but this doesn't have to be the case. In fact, many desert foods are packed with nutrients and can be a healthy part of your diet.",
	},
];

const SlideShow = () => {
	const [currIndex, setCurrIndex] = useState(0);
	const handleNextSlide = () => {
		setCurrIndex((prevIndex) => (prevIndex + 1) % items.length);
	};
	useEffect(() => {
		const intervalId = setInterval(handleNextSlide, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, []);
	return (
		<div className="home__slideshow">
			<div
				className="home__slideshow__container"
				style={{
					transition: `transform 1s ease-in-out`,
					transform: `translateX(-${currIndex * 100}vw)`,
				}}
			>
				{items.map(({ title, desc, imgSrc }, index) => (
					<Slide
						key={index}
						title={title}
						desc={desc}
						imgSrc={imgSrc}
					/>
				))}
			</div>
		</div>
	);
};

export default SlideShow;
