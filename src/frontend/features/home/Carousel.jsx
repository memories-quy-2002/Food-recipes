import React, { useEffect, useState } from "react";
import CarouselItem from "./carousel/CarouselItem";
import CarouselNavBar from "./carousel/CarouselNavBar";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const readReducedMotionPreference = () =>
	typeof window !== "undefined" &&
	typeof window.matchMedia === "function" &&
	window.matchMedia(REDUCED_MOTION_QUERY).matches;

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
	const [isUserPaused, setIsUserPaused] = useState(false);
	const [isPointerPaused, setIsPointerPaused] = useState(false);
	const [isFocusPaused, setIsFocusPaused] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(
		readReducedMotionPreference
	);
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
		if (
			typeof window === "undefined" ||
			typeof window.matchMedia !== "function"
		) {
			return undefined;
		}

		const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
		const handleChange = (event) => {
			setPrefersReducedMotion(event.matches);
		};

		setPrefersReducedMotion(mediaQuery.matches);
		mediaQuery.addEventListener?.("change", handleChange);

		return () => {
			mediaQuery.removeEventListener?.("change", handleChange);
		};
	}, []);

	const shouldAutoRotate =
		displayItems.length > 1 &&
		!isUserPaused &&
		!isPointerPaused &&
		!isFocusPaused &&
		!prefersReducedMotion;

	useEffect(() => {
		if (!shouldAutoRotate) return undefined;

		const intervalId = setInterval(() => {
			setCurrIndex((prevIndex) => (prevIndex + 1) % displayItems.length);
		}, 10000);
		return () => {
			clearInterval(intervalId);
		};
	}, [displayItems.length, shouldAutoRotate]);

	const handleFocusCapture = () => {
		setIsFocusPaused(true);
	};

	const handleBlurCapture = (event) => {
		if (!event.currentTarget.contains(event.relatedTarget)) {
			setIsFocusPaused(false);
		}
	};

	return (
		<div
			className="home__carousel"
			role="region"
			aria-roledescription="carousel"
			aria-label="Featured meals"
			onMouseEnter={() => setIsPointerPaused(true)}
			onMouseLeave={() => setIsPointerPaused(false)}
			onFocusCapture={handleFocusCapture}
			onBlurCapture={handleBlurCapture}
		>
			<div
				className="home__carousel__container"
				style={{
					transform: `translateX(-${currIndex * 100}%)`,
					transition: prefersReducedMotion ? "none" : undefined,
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
						isActive={currIndex === index}
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
					isPaused={isUserPaused}
					onTogglePause={() => setIsUserPaused((value) => !value)}
					showPauseControl={!prefersReducedMotion}
				/>
			)}
		</div>
	);
};

export default Carousel;
