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
		<main className="fr-page fr-content-page min-h-screen bg-[#f7f7f3] px-4 py-8 text-[#211813] sm:px-6 lg:px-8 lg:py-12">
			<PageHelmet
				title="About"
				description="Learn how Food Recipes helps home cooks discover, save, rate, and share everyday dishes."
				path="/about"
			/>
			<section className="mx-auto max-w-6xl rounded-[28px] border border-[#eee8df] bg-[#fffdf9] px-6 py-10 shadow-[0_18px_40px_rgba(33,24,19,0.07)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
				<div className="max-w-3xl">
					<span className="mb-5 block text-xs font-extrabold uppercase tracking-[0.08em] text-[#a94e00]">
						About Food Recipes
					</span>
					<h1 className="max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.055em]">
						A recipe library built for everyday cooking
					</h1>
					<p className="mt-5 max-w-2xl text-base leading-7 text-[#746b63] sm:text-lg">
						Food Recipes helps home cooks discover reliable dishes,
						save favorites, share their own recipes, and learn from
						community ratings.
					</p>
				</div>
			</section>

			<section className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-16">
				<div>
					<span className="mb-3 block text-xs font-extrabold uppercase tracking-[0.08em] text-[#746b63]">
						Our story
					</span>
					<h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-4xl">
						Simple tools for better meal decisions
					</h2>
				</div>
				<p className="max-w-2xl text-base leading-7 text-[#746b63]">
					The website is designed around the way people actually cook:
					searching quickly, comparing options, checking time, saving
					favorites, and returning to proven dishes. The goal is a
					quiet, useful cooking experience instead of a cluttered feed.
				</p>
			</section>

			<section aria-label="Our values" className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
				{values.map((value) => (
					<article className="rounded-[22px] border border-[#e7e1d9] bg-white p-6 shadow-[0_18px_40px_rgba(33,24,19,0.07)]" key={value.title}>
						<h3 className="text-xl font-extrabold tracking-[-0.03em]">{value.title}</h3>
						<p className="mt-3 text-sm leading-6 text-[#746b63]">{value.description}</p>
					</article>
				))}
			</section>
		</main>
	);
};

export default About;
