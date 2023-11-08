import React from "react";

const MenuSection = ({ list, listId, listName }) => {
	const sum = list.reduce(
		(partialSum, listItem) => partialSum + parseInt(listItem.recipe_count),
		0
	);
	return (
		<div className="food__menubar__section">
			<h5 className="food__menubar__section__title">{listName}</h5>
			<ul className="food__menubar__section__list">
				<li>
					<a
						href={`/food`}
						style={{
							fontWeight: `${listId ? "normal" : "bold"}`,
						}}
					>
						All <span style={{ color: "black" }}>({sum})</span>
					</a>
				</li>
				{list.map(({ id, name, recipe_count }) => {
					return (
						<li key={id}>
							<a
								href={`/food?${listName.toLowerCase()}=${id}`}
								style={{
									fontWeight: `${
										parseInt(listId) === id
											? "bold"
											: "normal"
									}`,
								}}
							>
								{name}{" "}
								<span style={{ color: "black" }}>
									({recipe_count})
								</span>
							</a>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default MenuSection;
