import React, { useEffect, useRef } from "react";

const CollectionRecipeDialog = ({
	open,
	recipeName,
	collections = [],
	isLoading = false,
	isSubmitting = false,
	pendingCollectionId = null,
	errorMessage = null,
	onAdd,
	onClose,
}) => {
	const closeButtonRef = useRef(null);

	useEffect(() => {
		if (!open) return undefined;
		closeButtonRef.current?.focus();
		const handleEscape = (event) => {
			if (event.key === "Escape" && !isSubmitting) onClose();
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isSubmitting, onClose, open]);

	if (!open) return null;

	return (
		<div className="wishlist__collection-dialog-backdrop" role="presentation">
			<section
				className="wishlist__collection-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="collection-recipe-dialog-title"
			>
				<header className="wishlist__collection-dialog__header">
					<div>
						<span>Saved organization</span>
						<h2 id="collection-recipe-dialog-title">Save to a collection</h2>
						<p>{recipeName}</p>
					</div>
					<button
						type="button"
						ref={closeButtonRef}
						onClick={onClose}
						disabled={isSubmitting}
						aria-label="Close save to collection dialog"
					>
						×
					</button>
				</header>
				{errorMessage && <p role="alert">{errorMessage}</p>}
				{isLoading ? (
					<p>Loading your collections…</p>
				) : collections.length === 0 ? (
					<div className="wishlist__collection-dialog__empty">
						<p>You do not have a collection yet.</p>
						<p>Create one from Saved Recipes, then return here to organize this recipe.</p>
					</div>
				) : (
					<div className="wishlist__collection-dialog__list" aria-label="Collections">
						{collections.map((collection) => {
							const collectionId = Number(collection.collection_id);
							const isPending = pendingCollectionId === collectionId;
							return (
								<div className="wishlist__collection-dialog__row" key={collectionId}>
									<span>{collection.name}</span>
									<button
										type="button"
										onClick={() => onAdd(collectionId)}
										disabled={isSubmitting}
										aria-busy={isPending}
										aria-label={`Save to ${collection.name}`}
									>
										{isPending ? "Saving…" : "Add"}
									</button>
								</div>
							);
						})}
					</div>
				)}
				<footer className="wishlist__collection-dialog__actions">
					<button type="button" onClick={onClose} disabled={isSubmitting}>
						Done
					</button>
				</footer>
			</section>
		</div>
	);
};

export default CollectionRecipeDialog;
