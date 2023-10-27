import React from "react";
import {
	BsArrowLeftShort,
	BsArrowRightShort,
	BsCircle,
	BsCircleFill,
} from "react-icons/bs";
const SlideShowNav = ({
	currIndex,
	items,
	onPrevSlide,
	onSpecSlide,
	onNextSlide,
}) => {
	return (
		<div className="home__slideshow__nav">
			<button onClick={onPrevSlide}>
				<BsArrowLeftShort color="orange" size={36} />
			</button>
			<div className="home__slideshow__nav__button">
				{items.map(({ id }) => (
					<button key={id} onClick={() => onSpecSlide(id)}>
						{currIndex === id - 1 ? (
							<BsCircleFill size={12} color="orange" />
						) : (
							<BsCircle size={12} />
						)}
					</button>
				))}
			</div>

			<button onClick={onNextSlide}>
				<BsArrowRightShort color="orange" size={36} />
			</button>
		</div>
	);
};

export default SlideShowNav;
