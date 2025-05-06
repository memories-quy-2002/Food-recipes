import React from "react";
import convertImage from "../../../utils/convertImage";
const CategorySection = ({ categories }) => {
	return (
		<div className="home__main__category">
			<h3 className="home__main__category__title">Category</h3>
			<div className="home__main__category__list">
				{categories
					.slice(0, 5)
					.map(({ id: category_id, name: category_name }) => (
						<div
							key={category_id}
							className="home__main__category__list__item"
						>
							{convertImage(category_name)}
							<div className="home__main__category__list__item__content">
								<h4>{category_name}</h4>
								<a href={`/food?categories=${category_id}`}>
									View all recipes
								</a>
							</div>
						</div>
					))}
			</div>
			<a href="/food" className="home__main__category__link">
				&#x2192; More categories
			</a>
		</div>
	);
};

export default CategorySection;
