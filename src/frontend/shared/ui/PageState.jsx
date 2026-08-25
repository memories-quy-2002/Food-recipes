import React from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import Button from "./Button";

const PageState = ({
	type = "loading",
	title,
	message,
	actionLabel,
	onAction,
}) => {
	const isLoading = type === "loading";
	const isError = type === "error";

	return (
		<section
			className="mx-auto flex min-h-[18rem] w-full max-w-3xl flex-col items-center justify-center gap-5 px-5 py-12 text-center sm:px-8"
			role={isError ? "alert" : "status"}
			aria-live={isError ? "assertive" : "polite"}
		>
			<div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
				{isLoading ? (
					<LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
				) : (
					<CircleAlert className="size-6" aria-hidden="true" />
				)}
			</div>
			<div className="max-w-xl space-y-2">
				<h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					{title || (isLoading ? "Loading" : "Something went wrong")}
				</h2>
				{message ? (
					<p className="text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
						{message}
					</p>
				) : null}
			</div>
			{actionLabel && onAction ? (
				<Button type="button" size="lg" onClick={onAction}>
					{actionLabel}
				</Button>
			) : null}
		</section>
	);
};

export default PageState;
