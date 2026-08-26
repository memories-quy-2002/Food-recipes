import type { ReactNode } from "react";
import { BsStar, BsStarFill, BsStarHalf } from "react-icons/bs";

const ratingStar = (
	overallScore: number | string | null | undefined,
	color = "currentColor",
): ReactNode[] => {
	const stars: ReactNode[] = [];
	const maxStars = 5;
	const score = Number(overallScore);

	for (let i = 1; i <= maxStars; i += 1) {
		if (i <= score) {
			stars.push(
				<div key={i} className="flex items-center">
					<BsStarFill color={color} />
				</div>,
			);
		} else if (i - 1 < score && score < i) {
			stars.push(
				<div key={i} className="flex items-center">
					<BsStarHalf color={color} />
				</div>,
			);
		} else {
			stars.push(
				<div key={i} className="flex items-center">
					<BsStar color={color} />{" "}
				</div>,
			);
		}
	}

	return stars;
};

export default ratingStar;
