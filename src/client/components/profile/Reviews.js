import React from "react";
import { useNavigate } from "react-router-dom";

const Reviews = ({ reviewsData = [] }) => {
	const navigate = useNavigate();
	const handleView = (recipe_id) => {
		navigate(`/recipe?id=${recipe_id}`);
	};
	const handleDelete = () => {
		console.log("Delete");
	};
	return (
		<div className="profile__container__main__reviews">
			<table className="profile__container__main__reviews__table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Recipe</th>
						<th>Score</th>
						<th>Review</th>
						<th>Date Rating</th>
						<th>Operations</th>
					</tr>
				</thead>
				<tbody>
					{reviewsData.map((review) => (
						<tr key={review.rating_id}>
							<td>{review.rating_id}</td>
							<td>{review.recipe_name}</td>
							<td>{review.score}</td>
							<td className="profile__container__main__reviews__table__truncate">
								{review.review}
							</td>
							<td>
								{Intl.DateTimeFormat("en-GB").format(
									new Date(review.date_added)
								)}
							</td>
							<td>
								<div className="profile__container__main__reviews__table__buttons">
									<button
										type="button"
										className="btn btn-primary"
										onClick={() =>
											handleView(review.recipe_id)
										}
									>
										View
									</button>
									<button
										type="button"
										className="btn btn-danger"
										onClick={handleDelete}
									>
										Delete
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Reviews;
