import React from "react";
import PageHelmet from "@/shared/seo/PageHelmet";

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
		<main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8 lg:py-12">
			<PageHelmet
				title="About"
				description="Learn how Food Recipes helps home cooks discover, save, rate, and share everyday dishes."
				path="/about"
			/>
			<section className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-10 shadow-lg shadow-foreground/10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
				<div className="max-w-3xl">
					<span className="mb-5 block text-xs font-extrabold uppercase tracking-[0.08em] text-primary">
						About Food Recipes
					</span>
					<h1 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
						A recipe library built for everyday cooking
					</h1>
					<p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
						Food Recipes helps home cooks discover reliable dishes,
						save favorites, share their own recipes, and learn from
						community ratings.
					</p>
				</div>
			</section>

			<section className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-16">
				<div>
					<span className="mb-3 block text-xs font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
						Our story
					</span>
					<h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-4xl">
						Simple tools for better meal decisions
					</h2>
				</div>
				<p className="max-w-2xl text-base leading-7 text-muted-foreground">
					The website is designed around the way people actually cook:
					searching quickly, comparing options, checking time, saving
					favorites, and returning to proven dishes. The goal is a
					quiet, useful cooking experience instead of a cluttered feed.
				</p>
			</section>

			<section aria-label="Our values" className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
				{values.map((value) => (
					<article className="rounded-2xl border border-border bg-card p-6 shadow-sm" key={value.title}>
						<h3 className="text-xl font-black tracking-[-0.03em]">{value.title}</h3>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">{value.description}</p>
					</article>
				))}
			</section>
		</main>
	);
};

export default About;
