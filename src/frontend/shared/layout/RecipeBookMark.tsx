import type { ReactElement } from "react";

export type RecipeBookMarkProps = {
	className?: string;
};

const RecipeBookMark = ({ className }: RecipeBookMarkProps): ReactElement => (
	<svg
		viewBox="0 0 40 40"
		className={className}
		fill="none"
		stroke="currentColor"
		strokeWidth="2.2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M20 10.5c-2.3-2.1-5.1-3.1-10.6-3.1a2.1 2.1 0 0 0-2.1 2.1v20.2a2.1 2.1 0 0 0 2.1 2.1c5.5 0 8.3 1 10.6 3.1" />
		<path d="M20 10.5c2.3-2.1 5.1-3.1 10.6-3.1a2.1 2.1 0 0 1 2.1 2.1v20.2a2.1 2.1 0 0 1-2.1 2.1c-5.5 0-8.3 1-10.6 3.1" />
		<path d="M20 10.5v24.4" />
		<path d="M11.7 14.8h4.6M11.7 19h4.6M23.7 14.8h4.6M23.7 19h4.6" />
	</svg>
);

export default RecipeBookMark;
