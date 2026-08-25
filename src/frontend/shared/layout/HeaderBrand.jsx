import React from "react";
import { Link } from "react-router-dom";

const HeaderBrand = () => (
	<Link to="/" className="inline-flex shrink-0 items-center gap-2.5 rounded-xl text-lg font-black tracking-[-0.04em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl" aria-label="Food Recipes home">
		<span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm" aria-hidden="true"><span className="h-4 w-2 rounded-sm bg-primary-foreground" /></span>
		<span className="hidden xs:inline sm:inline">food / recipes</span>
	</Link>
);
export default HeaderBrand;
