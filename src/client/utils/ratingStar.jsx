import { BsStar, BsStarFill, BsStarHalf } from "react-icons/bs";
import React from "react";
const ratingStar = (overallScore, color = "yellow") => {
	const stars = [];
	const maxStars = 5;

	for (let i = 1; i <= maxStars; i++) {
		if (i <= overallScore) {
			stars.push(
				<div key={i} className="d-flex align-items-center">
					<BsStarFill color={color} />
				</div>
			); // Full star
		} else if (i - 1 < overallScore && overallScore < i) {
			stars.push(
				<div key={i} className="d-flex align-items-center">
					<BsStarHalf color={color} />
				</div>
			); // Half star
		} else {
			stars.push(
				<div key={i} className="d-flex align-items-center">
					<BsStar color={color} />{" "}
				</div>
			); // Empty star
		}
	}

	return stars;
};
export default ratingStar;
