import React from "react";
import { Link } from "react-router-dom";

const HeaderBrand = () => {
	return (
		<Link to="/" className="fr-brand" aria-label="Food Recipes home">
			<span className="fr-brand__mark" aria-hidden="true" />
			<span>food / recipes</span>
		</Link>
	);
};

export default HeaderBrand;
