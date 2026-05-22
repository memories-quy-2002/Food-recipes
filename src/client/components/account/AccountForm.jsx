import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { useLocation, useNavigate } from "react-router-dom";

const AccountForm = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const searchParams = new URLSearchParams(location.search);
	const redirectPath = location.state?.from;
	const [isSignup, setIsSignup] = useState(
		searchParams.get("signup") === "true"
	);

	useEffect(() => {
		setIsSignup(searchParams.get("signup") === "true");
	}, [location.search]);

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
		<div className={`form ${isSignup ? "form--signup" : "form--login"}`}>
			<div className="form__aside">
				<p className="form__aside__eyebrow">Food Recipes account</p>
				<h1>{isSignup ? "Start saving recipes." : "Welcome back."}</h1>
				<p>
					{isSignup
						? "Create an account to save favorites, rate dishes, and keep your recipe activity in one place."
						: "Sign in to manage your wishlist, share reviews, and get back to recipes you already love."}
				</p>
				<ul className="form__aside__list">
					<li>Save favorite recipes</li>
					<li>Rate and review meals</li>
					<li>Manage your cooking profile</li>
				</ul>
			</div>

			<div className="form__card">
				{redirectPath && (
					<div className="form__notice" role="status">
						<strong>Sign in required</strong>
						<p>
							Log in or create an account to continue to that
							page.
						</p>
					</div>
				)}
				<div className="form__btnBox" role="tablist" aria-label="Account mode">
					<div
						className={`form__btnBox__slider ${
							isSignup ? "moveslider" : ""
						}`}
					/>
					<button
						type="button"
						role="tab"
						aria-selected={!isSignup}
						className="form__btnBox__button form__btnBox__login"
						onClick={onLogin}
					>
						Log in
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={isSignup}
						className="form__btnBox__button form__btnBox__signup"
						onClick={onSignup}
					>
						Sign up
					</button>
				</div>
				<div className="form__section">
					{isSignup ? (
						<SignupForm onLogin={onLogin} />
					) : (
						<LoginForm onSignup={onSignup} />
					)}
				</div>
			</div>
		</div>
	);
};

export default AccountForm;
