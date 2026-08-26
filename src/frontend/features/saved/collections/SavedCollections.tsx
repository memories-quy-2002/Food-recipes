import type { ReactElement } from "react";
import type { SavedCollection } from "@/features/saved/api/collectionsApi";

type CollectionSummary = Pick<SavedCollection, "collection_id" | "name" | "recipe_count">;

export type SavedCollectionsProps = {
	collections?: CollectionSummary[];
	selectedCollectionId: number | null;
	onSelect: (collectionId: number | null) => void;
	onCreate: () => void;
	onRename: (collection: CollectionSummary) => void;
	onDelete: (collection: CollectionSummary) => void;
};

const recipeCountLabel = (count: number): string => `${count} recipe${count === 1 ? "" : "s"}`;

const SavedCollections = ({
	collections = [],
	selectedCollectionId,
	onSelect,
	onCreate,
	onRename,
	onDelete,
}: SavedCollectionsProps): ReactElement => {
		const selectedCollection = collections.find((collection) => collection.collection_id === selectedCollectionId);

		return (
			<section className="wishlist__collections" aria-labelledby="saved-collections-heading">
				<div className="wishlist__collections__header">
					<div>
						<span>Saved organization</span>
						<h2 id="saved-collections-heading">Collections</h2>
					</div>
					<button type="button" onClick={onCreate}>Create collection</button>
				</div>
				<div className="wishlist__collections__tabs" role="tablist" aria-label="Saved recipe collections">
					<button type="button" role="tab" aria-selected={selectedCollectionId === null} onClick={() => onSelect(null)}>All saved</button>
					{collections.map((collection) => (
						<button
							key={collection.collection_id}
							type="button"
							role="tab"
							aria-selected={selectedCollectionId === collection.collection_id}
							onClick={() => onSelect(collection.collection_id)}
						>
							<span>{collection.name}</span>
							<small>{recipeCountLabel(Number(collection.recipe_count) || 0)}</small>
						</button>
					))}
				</div>
				{collections.length === 0 && <p className="wishlist__collections__empty">Create a collection to organize recipes you want to cook again.</p>}
				{selectedCollection && (
					<div className="wishlist__collections__actions">
						<span>Managing {selectedCollection.name}</span>
						<div>
							<button type="button" onClick={() => onRename(selectedCollection)}>Rename</button>
							<button type="button" onClick={() => onDelete(selectedCollection)}>Delete</button>
						</div>
					</div>
				)}
			</section>
		);
};

export default SavedCollections;
