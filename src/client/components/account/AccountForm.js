import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { useLocation } from "react-router-dom";
const AccountForm = () => {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const [isSignup, setIsSignup] = useState(
		searchParams.get("signup") === "true"
	);
	const onSignup = () => {
		setIsSignup(true);
	};
	const onLogin = () => {
		setIsSignup(false);
	};

	return (
		<div className="form">
			<div className="form__btnBox">
				<div
					className={`form__btnBox__slider ${
						isSignup ? "moveslider" : ""
					} `}
				></div>

				<button
					className="form__btnBox__button form__btnBox__login"
					onClick={onLogin}
				>
					Log in
				</button>
				<button
					className="form__btnBox__button form__btnBox__signup"
					onClick={onSignup}
				>
					Sign up
				</button>
			</div>
			<div className={`form__section ${isSignup ? "movesection" : ""}`}>
				<LoginForm onSignup={onSignup} />
				<SignupForm onLogin={onLogin} />
			</div>
		</div>
	);
};

export default AccountForm;
