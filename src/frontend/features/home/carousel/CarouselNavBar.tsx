import React from "react";
import {
	BsChevronLeft,
	BsChevronRight,
	BsPauseFill,
	BsPlayFill,
} from "react-icons/bs";
import Button from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";
import type { CarouselItemData } from "../Carousel";

export type CarouselNavBarProps = {
	currIndex: number;
	items: CarouselItemData[];
	onSpecSlide: (index: number) => void;
	onPrevSlide: () => void;
	onNextSlide: () => void;
	isPaused: boolean;
	onTogglePause: () => void;
	showPauseControl?: boolean;
};

const CarouselNavBar = ({
	currIndex,
	items,
	onSpecSlide,
	onPrevSlide,
	onNextSlide,
	isPaused,
	onTogglePause,
	showPauseControl = true,
}: CarouselNavBarProps): React.ReactElement => {
	return (
		<div
			className="absolute bottom-2 left-4 right-4 z-10 flex items-center gap-2 sm:bottom-6 sm:left-8 sm:right-auto lg:bottom-10 lg:left-14 xl:left-20 2xl:left-24"
			role="group"
			aria-label="Featured meal controls"
		>
			<Button
				type="button"
				variant="outline"
				size="icon"
				className="size-11 shrink-0 rounded-full border-background/30 bg-foreground/20 text-background backdrop-blur-md hover:border-background/60 hover:bg-background/10 hover:text-background"
				onClick={onPrevSlide}
				aria-label="Previous featured slide"
			>
				<BsChevronLeft size={16} aria-hidden="true" />
			</Button>

			<div className="flex min-w-0 max-w-[calc(100vw-11rem)] items-center gap-1.5 overflow-x-auto rounded-full border border-white/15 bg-black/20 p-1.5 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-w-md">
				{items.map(({ id, name }, index) => (
					<button
						type="button"
						className={cn(
							"size-11 shrink-0 rounded-full border border-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground",
							currIndex === index
								? "bg-background shadow-sm"
								: "bg-background/15 hover:bg-background/30"
						)}
						key={id || index}
						aria-label={`Show slide ${index + 1}: ${name}`}
						aria-current={currIndex === index ? "true" : undefined}
						onClick={() => onSpecSlide(index)}
					/>
				))}
			</div>

			<Button
				type="button"
				variant="outline"
				size="icon"
				className="size-11 shrink-0 rounded-full border-background/30 bg-foreground/20 text-background backdrop-blur-md hover:border-background/60 hover:bg-background/10 hover:text-background"
				onClick={onNextSlide}
				aria-label="Next featured slide"
			>
				<BsChevronRight size={16} aria-hidden="true" />
			</Button>

			{showPauseControl && (
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="hidden size-11 shrink-0 rounded-full border-background/30 bg-foreground/20 text-background backdrop-blur-md hover:border-background/60 hover:bg-background/10 hover:text-background sm:inline-flex"
					onClick={onTogglePause}
					aria-label={isPaused ? "Resume featured carousel" : "Pause featured carousel"}
					aria-pressed={isPaused}
				>
					{isPaused ? (
						<BsPlayFill size={15} aria-hidden="true" />
					) : (
						<BsPauseFill size={15} aria-hidden="true" />
					)}
				</Button>
			)}
		</div>
	);
};

export default CarouselNavBar;
