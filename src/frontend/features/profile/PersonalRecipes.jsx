import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import { isRecipeDeleteSuccess } from "@/shared/api/mutations";
import PageState from "@/shared/ui/PageState";
import convertImage from "@/shared/utils/convertImage";
import { Row, Col } from "@/shared/ui/legacy-ui";

const STATUS_FILTERS = ["all", "draft", "published", "archived"];
const statusLabel = (status) => status ? status[0].toUpperCase() + status.slice(1) : "Unknown";

const PersonalRecipes = ({ user }) => {
	const [personalRecipes, setPersonalRecipes] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [recipeId, setRecipeId] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [actionId, setActionId] = useState(null);
	const navigate = useNavigate();

	const fetchPersonalRecipes = useCallback(async () => {
		if (!user?.user_id) {
			setIsLoading(false);
			return;
		}
		try {
			setIsLoading(true);
			setError("");
			const response = await axios.get(apiRoutes.userRecipes, { params: { status: "all" } });
			if (response.status === undefined || response.status === 200) setPersonalRecipes(getArrayPayload(response.data, "recipes"));
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.message || "Unable to load your personal recipes.");
		} finally {
			setIsLoading(false);
		}
	}, [user?.user_id]);

	useEffect(() => { fetchPersonalRecipes(); }, [fetchPersonalRecipes]);

	const isInPreviousSevenDays = (date) => {
		const dateToCheck = new Date(date);
		const currentDate = new Date();
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(currentDate.getDate() - 7);
		return dateToCheck >= sevenDaysAgo && dateToCheck <= currentDate;
	};

	const visibleRecipes = useMemo(
		() => statusFilter === "all" ? personalRecipes : personalRecipes.filter((recipe) => (recipe.status || "published") === statusFilter),
		[personalRecipes, statusFilter]
	);

	const handleLifecycleAction = async (recipe, action) => {
		setActionId(recipe.recipe_id);
		setError("");
		try {
			const routeName = `recipe${action[0].toUpperCase()}${action.slice(1)}`;
			await axios.post(apiRoutes[routeName](recipe.recipe_id));
			await fetchPersonalRecipes();
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.message || `Unable to ${action} this recipe.`);
		} finally {
			setActionId(null);
		}
	};

	const handleDeleteRecipe = async () => {
		try {
			const response = await axios.delete(apiRoutes.recipe(recipeId));
			if (isRecipeDeleteSuccess(response.status)) {
				setShowModal(false);
				setRecipeId(0);
				await fetchPersonalRecipes();
			}
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.message || "Unable to delete this recipe.");
		}
	};

	return (
		<div className="profile__container__main__personal">
			<h1 className="profile__container__main__personal__title">Personal Recipes</h1>
			<p className="profile__container__main__personal__declaration">Here is a list of recipes you have added to Food Recipes.</p>
			<div className="d-flex gap-2 flex-wrap mb-4" role="group" aria-label="Recipe status filters">
				{STATUS_FILTERS.map((filter) => <button key={filter} type="button" className={`btn ${statusFilter === filter ? "btn-primary" : "btn-light"}`} aria-pressed={statusFilter === filter} onClick={() => setStatusFilter(filter)}>{statusLabel(filter)}</button>)}
			</div>
			{isLoading ? (
				<PageState title="Loading your recipes" message="Fetching recipes you have shared." />
			) : error ? (
				<PageState type="error" title="Personal recipes could not load" message={error} actionLabel="Try again" onAction={fetchPersonalRecipes} />
			) : visibleRecipes.length > 0 ? (
				<div className="profile__container__main__personal__container">
					<Row className="profile__container__main__personal__container__summary">
						<Col md={6}><div className="profile__container__main__personal__container__summary__item"><strong>{visibleRecipes.length}</strong><p>{statusFilter === "all" ? "Total" : statusLabel(statusFilter)}</p></div></Col>
						<Col md={6}><div className="profile__container__main__personal__container__summary__item"><strong>{visibleRecipes.filter((recipe) => isInPreviousSevenDays(recipe.date_added)).length}</strong><p>Previous 7 days</p></div></Col>
					</Row>
					<ul className="profile__container__main__personal__container__list">
						{visibleRecipes.map((recipe) => {
							const status = recipe.status || "published";
							const isBusy = actionId === recipe.recipe_id;
							return <li className="profile__container__main__personal__container__list__item" key={recipe.recipe_id}>
								<div>{convertImage(recipe.recipe_name, "profile__container__main__personal__container__list__item__img", recipe.image_url)}</div>
								<div className="profile__container__main__personal__container__list__item__context"><div className="d-flex gap-3 flex-column">
									<div className="d-flex justify-content-between align-items-start gap-2"><h5>{recipe.recipe_name || "Untitled draft"}</h5><span className={`badge text-bg-${status === "published" ? "success" : status === "archived" ? "secondary" : "warning"}`}>{statusLabel(status)}</span></div>
									<div className="d-flex gap-3"><div><strong>Category</strong><p>{recipe.category_name || "Not selected"}</p></div><div><strong>Meal</strong><p>{recipe.meal_name || "Not selected"}</p></div></div>
									<div className="d-flex gap-2 justify-content-end align-items-center flex-wrap" style={{ width: "100%" }}>
										{status === "published" && <button className="btn btn-info" type="button" onClick={() => navigate(`/recipe/?id=${recipe.recipe_id}`)}>View Recipe</button>}
										{status === "draft" && <button className="btn btn-primary" type="button" disabled={isBusy} aria-label={`Publish recipe ${recipe.recipe_name || "Untitled draft"}`} onClick={() => handleLifecycleAction(recipe, "publish")}>Publish</button>}
										{status === "published" && <button className="btn btn-light" type="button" disabled={isBusy} onClick={() => handleLifecycleAction(recipe, "archive")}>Archive</button>}
										{status === "archived" && <button className="btn btn-light" type="button" disabled={isBusy} onClick={() => handleLifecycleAction(recipe, "restore")}>Restore</button>}
										<button className="btn btn-danger" type="button" onClick={() => { setShowModal(true); setRecipeId(recipe.recipe_id); }}>Delete Recipe</button>
									</div>
								</div></div>
							</li>;
						})}
					</ul>
				</div>
			) : (
				<PageState type="empty" title={statusFilter === "all" ? "You have not created any recipes yet" : `No ${statusFilter} recipes yet.`} message="Start with one recipe image, a few ingredients, and the cooking steps." actionLabel="Add a recipe" onAction={() => navigate("/food/add")} />
			)}

			{showModal && <div className="wishlist__modal" role="dialog" aria-modal="true" aria-labelledby="delete-recipe-title"><div className="wishlist__modal__content"><h3 id="delete-recipe-title">Delete Recipe</h3><p>Are you sure you want to delete this recipe?</p><div className="wishlist__modal__buttons"><button className="btn btn-danger" type="button" onClick={handleDeleteRecipe}>Delete</button><button className="btn btn-primary" type="button" onClick={() => setShowModal(false)}>Cancel</button></div></div></div>}
		</div>
	);
};

export default PersonalRecipes;
