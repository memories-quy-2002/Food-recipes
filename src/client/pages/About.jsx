import React from "react";
import "../styles/About.scss";

const values = [
	{
		title: "Practical recipes",
		description:
			"Every recipe should be easy to scan, cook, save, and revisit when planning a meal.",
	},
	{
		title: "Shared inspiration",
		description:
			"The site brings personal recipes, ratings, and favorites into one simple cooking library.",
	},
	{
		title: "Clear choices",
		description:
			"Categories, meal types, prep time, and ratings help people decide what to cook without friction.",
	},
];

const About = () => {
	return (
		<main className="about">
			<section className="about__hero">
				<div>
					<span>About Food Recipes</span>
					<h1>A recipe library built for everyday cooking</h1>
					<p>
						Food Recipes helps home cooks discover reliable dishes,
						save favorites, share their own recipes, and learn from
						community ratings.
					</p>
				</div>
			</section>

			<section className="about__story">
				<div>
					<span>Our story</span>
					<h2>Simple tools for better meal decisions</h2>
				</div>
				<p>
					The website is designed around the way people actually cook:
					searching quickly, comparing options, checking time, saving
					favorites, and returning to proven dishes. The goal is a
					quiet, useful cooking experience instead of a cluttered feed.
				</p>
			</section>

			<section className="about__values">
				{values.map((value) => (
					<article key={value.title}>
						<h3>{value.title}</h3>
						<p>{value.description}</p>
					</article>
				))}
			</section>
		</main>
	);
};

export default About;
