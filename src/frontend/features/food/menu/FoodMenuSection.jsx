import React from "react";

const FoodMenuSection = ({
	list,
	listId,
	listName,
	onMenuClick,
	onMenuAllClick,
}) => {
	const filterName = listName === "Categories" ? "categoryId" : "mealId";

	return (
		<div className="food__menubar__section">
			<h3 className="food__menubar__section__title">{listName}</h3>
			<ul className="food__menubar__section__list">
				<li>
					<button
						type="button"
						className={`food__menubar__section__list__button${
							listId ? "" : " food__menubar__section__list__button--active"
						}`}
						onClick={() => onMenuAllClick(filterName)}
					>
						<span>All</span>
						<small>{list.length}</small>
					</button>
				</li>
				{list.map(({ id, name }) => {
					const isActive = parseInt(listId, 10) === id;

					return (
						<li key={id}>
							<button
								type="button"
								className={`food__menubar__section__list__button${
									isActive
										? " food__menubar__section__list__button--active"
										: ""
								}`}
								onClick={() => onMenuClick(id)}
							>
								<span>{name}</span>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default FoodMenuSection;
