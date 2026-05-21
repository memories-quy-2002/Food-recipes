import React, { Suspense, lazy, useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import FoodMenuBar from "../components/food/FoodMenuBar";
import PageHelmet from "../components/seo/PageHelmet";
import { RecipeContext } from "../context/RecipeProvider";
import "../styles/Food.scss";

const FoodContent = lazy(() => import("../components/food/FoodContent"));

const Food = () => {
	const [categories, setCategories] = useState([]);
	const [meals, setMeals] = useState([]);
	const { recipes } = useContext(RecipeContext);
	const navigate = useNavigate();
	const location = useLocation();
	const [selectedOptions, setSelectedOptions] = useState({
		categoryId: new URLSearchParams(location.search).get("categories") || "",
		mealId: new URLSearchParams(location.search).get("meals") || "",
		q: new URLSearchParams(location.search).get("q") || "",
	});

	const handleCategoryClick = (categoryId) => {
		setSelectedOptions((prevOptions) => ({
			...prevOptions,
			categoryId,
		}));
	};

	const handleMealClick = (mealId) => {
		setSelectedOptions((prevOptions) => ({
			...prevOptions,
			mealId,
		}));
	};

	const handleChangeSearchTerm = (event) => {
		setSelectedOptions((prevOptions) => ({
			...prevOptions,
			q: event.target.value,
		}));
	};

	const handleMenuAllClick = (name) => {
		setSelectedOptions((prevOptions) => ({
			...prevOptions,
			[name]: "",
		}));
	};

	const handleClearFilters = () => {
		setSelectedOptions({
			categoryId: "",
			mealId: "",
			q: "",
		});
	};

	useEffect(() => {
		const params = new URLSearchParams();

		if (selectedOptions.categoryId) {
			params.set("categories", selectedOptions.categoryId);
		}

		if (selectedOptions.mealId) {
			params.set("meals", selectedOptions.mealId);
		}

		if (selectedOptions.q) {
			params.set("q", selectedOptions.q);
		}

		const queryString = params.toString();
		const newUrl = queryString ? `/food?${queryString}` : "/food";
		navigate(newUrl);
	}, [selectedOptions, navigate]);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await axios.get("/category");
				if (response.status === 200) {
					setCategories(response.data.categories);
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchCategories();
	}, []);

	useEffect(() => {
		const fetchMeals = async () => {
			try {
				const response = await axios.get("/meal");
				if (response.status === 200) {
					setMeals(response.data.meals);
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchMeals();
	}, []);

	return (
		<Container fluid className="food">
			<PageHelmet
				title="Recipes"
				description="Search, filter, and compare recipes by category, meal type, name, and rating."
				path="/food"
			/>
			<div className="food__intro">
				<div className="food__intro__content">
					<span>Recipe finder</span>
					<h1>Explore delicious recipes</h1>
					<p>
						Filter by category, meal type, or search by name to find
						the right dish faster.
					</p>
				</div>
				<div className="food__summary" aria-label="Recipe library summary">
					<div>
						<strong>{recipes.length}</strong>
						<span>Total recipes</span>
					</div>
					<div>
						<strong>{categories.length}</strong>
						<span>Categories</span>
					</div>
					<div>
						<strong>{meals.length}</strong>
						<span>Meal types</span>
					</div>
				</div>
			</div>
			<Row className="food__layout">
				<Col lg={3} md={4} className="food__layout__aside">
					<FoodMenuBar
						categoryId={selectedOptions.categoryId}
						mealId={selectedOptions.mealId}
						searchTerm={selectedOptions.q}
						categories={categories}
						meals={meals}
						onCategoryClick={handleCategoryClick}
						onMealClick={handleMealClick}
						onMenuAllClick={handleMenuAllClick}
						onChangeSearchTerm={handleChangeSearchTerm}
						onClearFilters={handleClearFilters}
					/>
				</Col>
				<Col lg={9} md={8} className="food__layout__content">
					<Suspense
						fallback={
							<div className="loaderContainer">
								<div className="dot-elastic"></div>
							</div>
						}
					>
						<FoodContent
							recipes={recipes}
							categoryId={selectedOptions.categoryId}
							mealId={selectedOptions.mealId}
							searchTerm={selectedOptions.q}
						/>
					</Suspense>
				</Col>
			</Row>
		</Container>
	);
};

export default Food;
