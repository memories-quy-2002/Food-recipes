import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

const ErrorPage = () => (
	<main className="grid min-h-[70vh] place-items-center bg-background px-4 py-12 sm:px-6 lg:px-8">
		<PageHelmet title="Page Not Found" description="The page you requested could not be found on Food Recipes." path="/404" noIndex />
		<Card className="w-full max-w-2xl p-7 text-center sm:p-10">
			<p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Page not found</p>
			<h1 className="mt-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl">That recipe page is missing.</h1>
			<p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted-foreground">The link may be outdated, or the page may have moved. Your saved recipes and account data are unaffected.</p>
			<Button asChild size="lg" className="mt-7"><Link to="/food">Browse recipes<ArrowRight className="size-4" /></Link></Button>
		</Card>
	</main>
);
export default ErrorPage;
