import React from "react";
import { getApiTarget } from "@/shared/api/config";
import { getSavedCollectionsContract } from "./collectionsContract";

const SavedCollectionsNotice = () => {
	const contract = getSavedCollectionsContract(getApiTarget());

	return (
		<section
			className="wishlist__collections-notice"
			aria-labelledby="saved-collections-title"
		>
			<div>
				<span className="wishlist__collections-notice__eyebrow">
					Saved organization
				</span>
				<h2 id="saved-collections-title">Collections are coming soon</h2>
				<p>
					{contract.reason} Saved recipes remain available in the default
					<strong> {contract.defaultCollection.name}</strong> view.
				</p>
			</div>
		</section>
	);
};

export default SavedCollectionsNotice;
