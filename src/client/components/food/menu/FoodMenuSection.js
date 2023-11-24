import React from "react";

const FoodMenuSection = ({
	list,
	listId,
	listName,
	onMenuClick,
	onMenuAllClick,
}) => {
	return (
		<div className="food__menubar__section">
			<h5 className="food__menubar__section__title">{listName}</h5>
			<ul className="food__menubar__section__list">
				<li>
					<span
						href={`/food`}
						style={{
							cursor: "pointer",
							color: "orange",
							fontWeight: `${listId ? "normal" : "bold"}`,
						}}
						onClick={() =>
							onMenuAllClick(
								listName === "Categories"
									? "categoryId"
									: "mealId"
							)
						}
					>
						All <span style={{ color: "black" }}></span>
					</span>
				</li>
				{list.map(({ id, name }) => {
					return (
						<li key={id}>
							<span
								style={{
									cursor: "pointer",
									color: "orange",
									fontWeight: `${
										parseInt(listId) === id
											? "bold"
											: "normal"
									}`,
								}}
								onClick={() => onMenuClick(id)}
							>
								{name}{" "}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default FoodMenuSection;
