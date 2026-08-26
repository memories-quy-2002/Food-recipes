declare module "@/features/saved/collections/CollectionRecipeDialog" {
	import type { ComponentType } from "react";

	type CollectionRecipeDialogProps = {
		open: boolean;
		recipeName: string;
		collections?: Array<{ collection_id: number; name: string }>;
		isLoading?: boolean;
		isSubmitting?: boolean;
		pendingCollectionId?: number | null;
		errorMessage?: string | null;
		onAdd: (collectionId: number) => void;
		onClose: () => void;
	};

	const CollectionRecipeDialog: ComponentType<CollectionRecipeDialogProps>;
	export default CollectionRecipeDialog;
}
