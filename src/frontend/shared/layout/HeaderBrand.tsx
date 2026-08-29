import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import RecipeBookMark from "./RecipeBookMark";

const HeaderBrand = (): ReactElement => (
	<Link
		to="/"
		className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-1 text-[0.96rem] font-extrabold tracking-[-0.03em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg"
		aria-label="Food recipes home"
	>
		<span
			className="grid size-10 place-items-center rounded-[0.85rem] bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/10"
			aria-hidden="true"
		>
			<RecipeBookMark className="size-6" />
		</span>
		<span>Food recipes</span>
	</Link>
);

export default HeaderBrand;
