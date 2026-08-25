import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { useToast } from "@/app/ToastProvider";
import Button from "@/shared/ui/Button";
import { buildRecipeShareUrl, shareRecipe } from "./recipeSharing";

const ShareRecipeButton = ({ recipeId, recipeName, description, className }) => {
	const [isPending, setIsPending] = useState(false);
	const [status, setStatus] = useState("");
	const { showToast } = useToast();

	const handleShare = async () => {
		if (isPending) return;
		setIsPending(true);
		setStatus("");

		try {
			const result = await shareRecipe({
				title: recipeName,
				text: description,
				url: buildRecipeShareUrl(recipeId, window.location.origin),
			});

			if (result === "shared") {
				setStatus("Recipe shared.");
				showToast({ title: "Recipe shared" });
			} else if (result === "copied") {
				setStatus("Recipe link copied to clipboard.");
				showToast({ title: "Recipe link copied to clipboard" });
			} else if (result === "cancelled") {
				setStatus("Share cancelled.");
			}
		} catch (error) {
			const message = error?.message === "SHARE_UNAVAILABLE"
				? "Sharing isn't available in this browser."
				: "We couldn't share this recipe. Please try again.";
			setStatus(message);
			showToast({ title: message, type: "error" });
		} finally {
			setIsPending(false);
		}
	};

	return (
		<>
			<Button type="button" size="lg" variant="outline" className={className} onClick={handleShare} disabled={isPending} aria-busy={isPending} aria-label="Share recipe">
				<Share2 className="size-4" aria-hidden="true" />
				{isPending ? "Sharing…" : "Share"}
			</Button>
			<p className="sr-only" role="status" aria-live="polite">{status}</p>
		</>
	);
};

export default ShareRecipeButton;
