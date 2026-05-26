import React from "react";
import convertImage from "@/shared/utils/convertImage";
const CategorySection = ({
	categories,
	selectedCategoryId,
	onCategorySelect,
}) => {
	return (
		<div className="home__main__category">
			<div className="home__sectionHeader">
				<div>
					<span>Cook by mood</span>
					<h3 className="home__main__category__title">Categories</h3>
				</div>
				<a href="/food" className="home__main__category__link">
					Browse all categories
				</a>
			</div>
			<div className="home__main__category__list">
				<button
					type="button"
					className={`home__main__category__list__item home__main__category__list__item--all ${
						selectedCategoryId === "all"
							? "home__main__category__list__item--active"
							: ""
					}`}
					onClick={() => onCategorySelect("all")}
					aria-pressed={selectedCategoryId === "all"}
				>
					<div className="home__main__category__list__item__content">
						<h4>All categories</h4>
						<p>Show featured recipes from every category.</p>
					</div>
				</button>
				{categories
					.slice(0, 5)
					.map(({ id: category_id, name: category_name }) => (
						<button
							key={category_id}
							type="button"
							className={`home__main__category__list__item ${
								Number(selectedCategoryId) === Number(category_id)
									? "home__main__category__list__item--active"
									: ""
							}`}
							onClick={() => onCategorySelect(category_id)}
							aria-pressed={
								Number(selectedCategoryId) === Number(category_id)
							}
						>
							{convertImage(category_name)}
							<div className="home__main__category__list__item__content">
								<h4>{category_name}</h4>
								<span>Filter featured recipes</span>
							</div>
						</button>
					))}
			</div>
		</div>
	);
};

export default CategorySection;
