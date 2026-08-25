import React, { useEffect, useState } from "react";
import Input from "@/shared/ui/Input";

const CollectionDialog = ({
	open,
	mode = "create",
	initialName = "",
	isSubmitting = false,
	errorMessage = null,
	onClose,
	onSubmit,
}) => {
	const [name, setName] = useState(initialName);
	const [validationError, setValidationError] = useState(null);

	useEffect(() => {
		if (!open) return undefined;
		setName(initialName);
		setValidationError(null);
		const handleEscape = (event) => {
			if (event.key === "Escape" && !isSubmitting) onClose();
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [initialName, isSubmitting, onClose, open]);

	if (!open) return null;

	const isRename = mode === "rename";
	const submit = (event) => {
		event.preventDefault();
		const normalizedName = name.trim();
		if (!normalizedName) {
			setValidationError("Enter a collection name");
			return;
		}
		setValidationError(null);
		onSubmit(normalizedName);
	};

	return (
		<div className="wishlist__collection-dialog-backdrop" role="presentation">
			<section className="wishlist__collection-dialog" role="dialog" aria-modal="true" aria-labelledby="collection-dialog-title">
				<header className="wishlist__collection-dialog__header">
					<div>
						<span>Saved organization</span>
						<h2 id="collection-dialog-title">{isRename ? "Rename collection" : "Create collection"}</h2>
					</div>
					<button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close collection dialog">×</button>
				</header>
				<form onSubmit={submit}>
					<label htmlFor="collection-name">Collection name</label>
					<Input id="collection-name" name="name" type="text" value={name} maxLength={80} autoFocus autoComplete="off" onChange={(event) => setName(event.target.value)} aria-describedby="collection-name-help" />
					<p id="collection-name-help" className="mt-2 text-sm leading-6 text-muted-foreground">Use a short name you will recognize when saving recipes.</p>
					{(validationError || errorMessage) && <p role="alert">{validationError || errorMessage}</p>}
					<div className="wishlist__collection-dialog__actions">
						<button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
						<button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : isRename ? "Save changes" : "Create collection"}</button>
					</div>
				</form>
			</section>
		</div>
	);
};

export default CollectionDialog;
