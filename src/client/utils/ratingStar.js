import { BsFillStarFill, BsStar, BsStarHalf } from "react-icons/bs";

const ratingStar = (overallScore) => {
	const stars = [];
	const maxStars = 5;
	for (let i = 1; i <= maxStars; i++) {
		if (i <= overallScore) {
			stars.push(
				<span key={i}>
					<BsFillStarFill />
				</span>
			); // Full star
		} else if (i - 0.5 === overallScore) {
			stars.push(
				<span key={i}>
					<BsStarHalf />
				</span>
			); // Half star
		} else {
			stars.push(
				<span key={i}>
					<BsStar />{" "}
				</span>
			); // Empty star
		}
	}
	return stars;
};
export default ratingStar;
