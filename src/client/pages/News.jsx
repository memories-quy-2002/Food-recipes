import React from "react";
import "../styles/News.scss";

const newsItems = [
	{
		title: "10 new recipes added to the kitchen",
		category: "Recipe update",
		date: "May 21, 2026",
		description:
			"Fresh dinner, breakfast, soup, seafood, and dessert ideas are now ready to browse in the recipe collection.",
	},
	{
		title: "Better browsing for saved favorites",
		category: "Product",
		date: "May 21, 2026",
		description:
			"The wishlist now supports searching, sorting, and faster access to the recipes you keep coming back to.",
	},
	{
		title: "Seasonal cooking guide",
		category: "Cooking",
		date: "May 20, 2026",
		description:
			"Use herbs, citrus, and lighter sauces to make familiar meals feel brighter without adding complexity.",
	},
];

const quickTips = [
	"Use recipe ratings to choose dishes faster.",
	"Save recipes to your wishlist before planning meals.",
	"Add prep and cook time so every recipe is easier to compare.",
];

const News = () => {
	return (
		<main className="news">
			<section className="news__hero">
				<div>
					<span>Latest from Food Recipes</span>
					<h1>Kitchen news, updates, and cooking ideas</h1>
					<p>
						Follow new recipe drops, product updates, and practical
						cooking notes from the Food Recipes team.
					</p>
				</div>
			</section>

			<section className="news__layout">
				<div className="news__list">
					{newsItems.map((item) => (
						<article className="news__card" key={item.title}>
							<div className="news__card__meta">
								<span>{item.category}</span>
								<time>{item.date}</time>
							</div>
							<h2>{item.title}</h2>
							<p>{item.description}</p>
							<a href="/food">Browse recipes</a>
						</article>
					))}
				</div>

				<aside className="news__aside">
					<h2>Quick tips</h2>
					<ul>
						{quickTips.map((tip) => (
							<li key={tip}>{tip}</li>
						))}
					</ul>
				</aside>
			</section>
		</main>
	);
};

export default News;
