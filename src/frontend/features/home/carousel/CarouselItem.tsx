import React from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";
import Button from "@/shared/ui/Button";

export type CarouselItemProps = {
	id: number | null;
	title: string;
	desc: string;
	imgSrc: string;
	index: number;
	total: number;
	isActive: boolean;
};

const CarouselItem = ({
	id,
	title,
	desc,
	imgSrc,
	index,
	total,
	isActive,
}: CarouselItemProps): React.ReactElement => {
	const navigate = useNavigate();

	return (
		<article
			className="grid min-h-[29rem] w-full shrink-0 grid-cols-1 lg:min-h-[30rem] lg:grid-cols-[0.92fr_1.08fr]"
			role="group"
			aria-roledescription="slide"
			aria-label={`${index + 1} of ${total}: ${title}`}
			aria-hidden={!isActive}
			inert={isActive ? undefined : true}
		>
			<div className="order-2 flex min-w-0 flex-col justify-center px-5 pb-24 pt-8 sm:px-8 lg:order-1 lg:px-14 lg:py-16 xl:px-20 2xl:px-24">
				<span className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-secondary">
					{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
				</span>
				<h2 className="max-w-[14ch] text-balance text-4xl font-black leading-[0.98] tracking-[-0.045em] text-background sm:text-5xl lg:text-6xl">
					{title}
				</h2>
				<p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
					{desc}
				</p>
				<div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
					<Button
						type="button"
						size="lg"
						className="h-auto min-h-12 rounded-xl bg-primary px-6 font-black text-primary-foreground shadow-lg shadow-black/10 hover:bg-primary/90"
						onClick={() => navigate(id ? `/food?meals=${id}` : "/food")}
					>
						Explore this meal
					</Button>
					<Button
						type="button"
						size="lg"
						variant="outline"
						className="h-auto min-h-12 rounded-xl border-background/35 bg-transparent px-6 font-black text-background hover:border-background/60 hover:bg-background/10 hover:text-background"
						onClick={() => navigate("/food")}
					>
						Browse all
					</Button>
				</div>
			</div>

			<div className="order-1 min-h-0 overflow-hidden lg:order-2">
				{convertImage(
					imgSrc,
					"block aspect-[4/3] h-full min-h-[16rem] w-full object-cover object-center sm:min-h-[22rem] lg:aspect-auto lg:min-h-[30rem]"
				)}
			</div>
		</article>
	);
};

export default CarouselItem;
