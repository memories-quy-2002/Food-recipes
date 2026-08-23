import React from "react";
import Button from "./Button";

const PageState = ({
	type = "loading",
	title,
	message,
	actionLabel,
	onAction,
}) => {
	const isLoading = type === "loading";

	return (
		<div className={`page-state page-state--${type}`} role="status">
			{isLoading && <div className="dot-elastic"></div>}
			<div>
				<h2>{title || (isLoading ? "Loading" : "Something went wrong")}</h2>
				{message && <p>{message}</p>}
				{actionLabel && onAction && (
					<Button type="button" className="page-state__action mt-4" onClick={onAction}>
						{actionLabel}
					</Button>
				)}
			</div>
		</div>
	);
};

export default PageState;
