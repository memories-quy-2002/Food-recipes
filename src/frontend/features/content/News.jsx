import React from "react";
import PageHelmet from "@/shared/seo/PageHelmet";

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
			"Saved recipes now support searching, sorting, and faster access to the dishes you keep coming back to.",
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
	"Save recipes before planning meals.",
	"Add prep and cook time so every recipe is easier to compare.",
];

const News = () => {
	return (
		<main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8 lg:py-12">
			<PageHelmet
				title="News"
				description="Read Food Recipes updates, new recipe announcements, and practical cooking ideas."
				path="/news"
			/>
			<section className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-10 shadow-lg shadow-foreground/10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
				<div className="max-w-3xl">
					<span className="mb-5 block text-xs font-extrabold uppercase tracking-[0.08em] text-primary">
						Latest from Food Recipes
					</span>
					<h1 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
						Kitchen news, updates, and cooking ideas
					</h1>
					<p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
						Follow new recipe drops, product updates, and practical
						cooking notes from the Food Recipes team.
					</p>
				</div>
			</section>

			<section className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)] lg:items-start">
				<div className="grid gap-4">
					{newsItems.map((item) => (
						<article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7" key={item.title}>
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-extrabold uppercase tracking-[0.08em] text-primary">
								<span>{item.category}</span>
								<time dateTime={item.date}>{item.date}</time>
							</div>
							<h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-[-0.035em] sm:text-3xl">{item.title}</h2>
							<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{item.description}</p>
							<a className="mt-5 inline-flex min-h-11 items-center text-sm font-extrabold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary" href="/food">Browse recipes</a>
						</article>
					))}
				</div>

				<aside className="rounded-2xl border border-border bg-muted p-6 sm:p-7" aria-labelledby="quick-tips-title">
					<h2 className="text-2xl font-extrabold tracking-[-0.035em]" id="quick-tips-title">Quick tips</h2>
					<ul className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground">
						{quickTips.map((tip) => (
							<li className="flex gap-3" key={tip}><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />{tip}</li>
						))}
					</ul>
				</aside>
			</section>
		</main>
	);
};

export default News;
