import React from "react";

const MenuSection = ({ list, listId, listName }) => {
	return (
		<div className="food__menubar__section">
			<h5 className="food__menubar__section__title">{listName}</h5>
			<ul className="food__menubar__section__list">
				{list.map(({ id, name }) => {
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
								{name}
							</a>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default MenuSection;
