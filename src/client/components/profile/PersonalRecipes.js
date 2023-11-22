import React from "react";

const PersonalRecipes = () => {
	return (
		<div className="profile__container__main__personal">
			<div className="profile__container__main__personal__container">
				<strong style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
					You haven't created any recipes yet
				</strong>
				<p style={{ marginBottom: "2rem" }}>
					To add a recipe click the button below
				</p>
				<button
					className="profile__container__main__personal__container__button"
					type="button"
				>
					Add a recipe +
				</button>
			</div>
		</div>
	);
};

export default PersonalRecipes;
