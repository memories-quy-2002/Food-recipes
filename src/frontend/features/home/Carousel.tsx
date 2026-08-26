import React, { useEffect, useState, type FocusEvent } from "react";
import CarouselItem from "./carousel/CarouselItem";
import CarouselNavBar from "./carousel/CarouselNavBar";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type CarouselItemData = {
	id: number | null;
	name: string;
	description?: string | null;
	imageName?: string | null;
};

const readReducedMotionPreference = (): boolean =>
	typeof window !== "undefined" &&
	typeof window.matchMedia === "function" &&
	window.matchMedia(REDUCED_MOTION_QUERY).matches;

const fallbackItems: CarouselItemData[] = [
	{
		id: null,
		name: "Cook something memorable",
		description:
			"Discover comforting meals, quick weeknight ideas, and fresh dishes for every table.",
		imageName: "main",
	},
];

export type CarouselProps = {
	items: CarouselItemData[];
};

const Carousel = ({ items }: CarouselProps): React.ReactElement => {
	const [currIndex, setCurrIndex] = useState<number>(0);
	const [isUserPaused, setIsUserPaused] = useState<boolean>(false);
	const [isPointerPaused, setIsPointerPaused] = useState<boolean>(false);
	const [isFocusPaused, setIsFocusPaused] = useState<boolean>(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
		readReducedMotionPreference
	);
	const displayItems = items.length ? items : fallbackItems;

	const handleSpecSlide = (index: number): void => setCurrIndex(index);
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
		if (currIndex >= displayItems.length) setCurrIndex(0);
	}, [currIndex, displayItems.length]);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			typeof window.matchMedia !== "function"
		) {
			return undefined;
		}

		const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
		const handleChange = (event: MediaQueryListEvent): void =>
			setPrefersReducedMotion(event.matches);

		setPrefersReducedMotion(mediaQuery.matches);
		mediaQuery.addEventListener?.("change", handleChange);
		return () => mediaQuery.removeEventListener?.("change", handleChange);
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
		return () => clearInterval(intervalId);
	}, [displayItems.length, shouldAutoRotate]);

	const handleBlurCapture = (event: FocusEvent<HTMLElement>): void => {
		if (!event.currentTarget.contains(event.relatedTarget)) {
			setIsFocusPaused(false);
		}
	};

	return (
		<section
			className="relative isolate mx-auto mt-4 w-[calc(100%-1.5rem)] max-w-[96rem] overflow-hidden rounded-3xl bg-foreground text-background shadow-xl shadow-foreground/15 sm:mt-6 sm:w-[calc(100%-2.5rem)] lg:mt-8 lg:w-[calc(100%-4rem)]"
			role="region"
			aria-roledescription="carousel"
			aria-label="Featured meals"
			onMouseEnter={() => setIsPointerPaused(true)}
			onMouseLeave={() => setIsPointerPaused(false)}
			onFocusCapture={() => setIsFocusPaused(true)}
			onBlurCapture={handleBlurCapture}
		>
			<div
				className="flex w-full will-change-transform"
				style={{
					transform: `translateX(-${currIndex * 100}%)`,
					transition: prefersReducedMotion ? "none" : "transform 600ms cubic-bezier(0.22,1,0.36,1)",
				}}
			>
				{displayItems.map(({ id, name, description, imageName }, index) => (
					<CarouselItem
						key={id || index}
						id={id}
						title={name}
						desc={description ?? ""}
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
		</section>
	);
};

export default Carousel;
