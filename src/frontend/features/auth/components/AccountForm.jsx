import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import {
	clearAuthIntentIfUnchanged,
	getAuthIntentSnapshot,
} from "@/features/auth/returnIntent";
import Button from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";

const AccountForm = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const searchParams = new URLSearchParams(location.search);
	const redirectPath = location.state?.from;
	const intentSnapshot = useRef(getAuthIntentSnapshot());
	const cleanupTimer = useRef(null);
	const [isSignup, setIsSignup] = useState(
		searchParams.get("signup") === "true"
	);

	useEffect(() => {
		setIsSignup(searchParams.get("signup") === "true");
	}, [location.search]);

	useEffect(() => {
		if (cleanupTimer.current !== null) {
			clearTimeout(cleanupTimer.current);
			cleanupTimer.current = null;
		}

		return () => {
			cleanupTimer.current = setTimeout(() => {
				cleanupTimer.current = null;
				clearAuthIntentIfUnchanged(intentSnapshot.current);
			}, 0);
		};
	}, []);

	const onSignup = () => {
		setIsSignup(true);
		navigate("/account?signup=true", {
			replace: true,
			state: location.state,
		});
	};

	const onLogin = () => {
		setIsSignup(false);
		navigate("/account?signup=false", {
			replace: true,
			state: location.state,
		});
	};

	return (
		<section className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-card shadow-2xl shadow-black/25 lg:grid-cols-[0.9fr_1.1fr]">
			<aside className="hidden min-h-[42rem] flex-col justify-center bg-[linear-gradient(145deg,rgba(33,24,19,0.98),rgba(112,58,24,0.94))] p-10 text-[#fff8ef] lg:flex xl:p-14">
				<p className="mb-4 w-fit rounded-full border border-[#ffd18b]/35 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#ffd18b]">
					Food Recipes account
				</p>
				<h1 className="max-w-[9ch] text-balance text-5xl font-black leading-[0.95] tracking-[-0.05em] xl:text-6xl">
					{isSignup ? "Start saving recipes." : "Welcome back."}
				</h1>
				<p className="mt-6 max-w-md text-base leading-7 text-[#fff8ef]/75">
					{isSignup
						? "Create an account to save favorites, rate dishes, and keep your recipe activity in one place."
						: "Sign in to manage your Saved Recipes, share reviews, and get back to recipes you already love."}
				</p>
				<ul className="mt-8 grid gap-3 text-sm font-bold text-[#fff8ef]/90">
					{[
						"Save favorite recipes",
						"Rate and review meals",
						"Manage your cooking profile",
					].map((item) => (
						<li key={item} className="flex items-center gap-3">
							<span className="size-2 rounded-full bg-[#ff9f1c]" aria-hidden="true" />
							{item}
						</li>
					))}
				</ul>
			</aside>

			<div className="flex min-h-[36rem] flex-col justify-center bg-background p-5 sm:p-8 lg:p-10 xl:p-12">
				<div className="mb-7 lg:hidden">
					<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
						Food Recipes account
					</p>
					<h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
						{isSignup ? "Start saving recipes." : "Welcome back."}
					</h1>
				</div>

				{redirectPath && (
					<div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
						<strong className="block font-black">Sign in required</strong>
						<p className="mt-1 leading-6">
							Log in or create an account to continue to that page.
						</p>
					</div>
				)}

				<div
					className="mb-8 grid w-full grid-cols-2 rounded-xl border border-border bg-muted/60 p-1 sm:max-w-sm"
					role="tablist"
					aria-label="Account mode"
				>
					<Button
						type="button"
						role="tab"
						aria-selected={!isSignup}
						variant="ghost"
						className={cn(
							"h-11 rounded-lg font-black",
							!isSignup && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
						)}
						onClick={onLogin}
					>
						Log in
					</Button>
					<Button
						type="button"
						role="tab"
						aria-selected={isSignup}
						variant="ghost"
						className={cn(
							"h-11 rounded-lg font-black",
							isSignup && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
						)}
						onClick={onSignup}
					>
						Sign up
					</Button>
				</div>

				<div className="w-full">
					{isSignup ? (
						<SignupForm onLogin={onLogin} />
					) : (
						<LoginForm onSignup={onSignup} />
					)}
				</div>
			</div>
		</section>
	);
};

export default AccountForm;
