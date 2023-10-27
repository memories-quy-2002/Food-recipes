import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
const AccountForm = () => {
	const [isSignup, setIsSignup] = useState(true);
	const onSignup = () => {
		setIsSignup(true);
	};
	const onLogin = () => {
		setIsSignup(false);
	};

	const handleFormState = (setState) => (e) => {
		setState(e.target.value);
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
				<LoginForm handleFormState={handleFormState} />
				<SignupForm handleFormState={handleFormState} />
			</div>
		</div>
	);
};

export default AccountForm;
