import type { ReactElement } from "react";
import { ChefHat } from "lucide-react";
import { Link } from "react-router-dom";

const HeaderBrand = (): ReactElement => (
	<Link
		to="/"
		className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 rounded-xl px-1 text-lg font-black tracking-[-0.04em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl"
		aria-label="Food Recipes home"
	>
		<span
			className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"
			aria-hidden="true"
		>
			<ChefHat className="size-5" strokeWidth={2.5} />
		</span>
		<span className="hidden xs:inline sm:inline">food / recipes</span>
	</Link>
);

export default HeaderBrand;
