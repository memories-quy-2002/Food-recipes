import React from "react";

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
					<button type="button" onClick={onAction}>
						{actionLabel}
					</button>
				)}
			</div>
		</div>
	);
};

export default PageState;
