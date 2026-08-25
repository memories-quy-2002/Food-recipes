import React from "react";
import { ChefHat } from "lucide-react";
import { Link } from "react-router-dom";
import { BsMailbox } from "react-icons/bs";
import { FaHouse, FaPhone } from "react-icons/fa6";
import { siteContent } from "@/shared/utils/siteContent";

const Footer = () => {
	const d = new Date();
	const { about, contact, primaryNavigation, secondaryNavigation, follow, bottom } = siteContent;
	const linkClass = "inline-flex min-h-11 items-center rounded-md px-1 text-sm text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
	return (
		<footer className="mt-6 border-t border-border bg-card/40 px-4 py-6 sm:px-6 lg:mt-8 lg:px-8">
			<div className="mx-auto grid w-full max-w-[96rem] grid-cols-2 gap-x-8 gap-y-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
				<div className="col-span-2 lg:col-span-1">
					<Link
						to="/"
						className="inline-flex min-h-11 items-center gap-2.5 rounded-xl text-xl font-black tracking-[-0.04em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
							<ChefHat className="size-4" strokeWidth={2.5} />
						</span>
						food / recipes
					</Link>
					<h2 className="mt-4 text-sm font-black">About us</h2>
					<p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{about}</p>
				</div>

				<div className="col-span-2 lg:col-span-1">
					<h2 className="mb-2 text-sm font-black">Contact</h2>
					<ul className="grid gap-2 text-sm text-muted-foreground">
						<li className="flex gap-2">
							<BsMailbox className="mt-0.5 shrink-0" aria-hidden="true" />
							{contact.email}
						</li>
						<li className="flex gap-2">
							<FaPhone className="mt-0.5 shrink-0" aria-hidden="true" />
							{contact.phone}
						</li>
						<li className="flex gap-2">
							<FaHouse className="mt-0.5 shrink-0" aria-hidden="true" />
							{contact.address}
						</li>
					</ul>
				</div>

				<nav aria-label="Footer navigation" className="min-w-0">
					<h2 className="mb-1 text-sm font-black">Explore</h2>
					<ul className="flex flex-wrap gap-x-3 gap-y-0.5">
						{primaryNavigation.map((item) => (
							<li key={item.href}>
								<Link className={linkClass} to={item.href}>
									{item.title}
								</Link>
							</li>
						))}
					</ul>
					<h2 className="mb-1 mt-3 text-sm font-black">More</h2>
					<ul className="flex flex-wrap gap-x-3 gap-y-0.5">
						{secondaryNavigation.map((item) => (
							<li key={item.href}>
								<Link className={linkClass} to={item.href}>
									{item.title}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				<div className="min-w-0">
					<h2 className="mb-1 text-sm font-black">Follow us</h2>
					<ul className="flex flex-wrap gap-2">
						{follow.map(({ href, Icon, label }) => (
							<li key={href}>
								<a
									className="grid size-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Visit Food Recipes on ${label}`}
								>
									<Icon size={20} />
								</a>
							</li>
						))}
					</ul>
				</div>

				<div className="col-span-2 border-t border-border pt-3 lg:col-span-4">
					<p className="text-sm text-muted-foreground">
						&copy; {d.getFullYear()} {bottom}
					</p>
				</div>
			</div>
		</footer>
	);
};
export default Footer;
