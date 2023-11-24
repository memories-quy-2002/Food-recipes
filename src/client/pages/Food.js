import React, { Suspense, lazy, useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import FoodMenuBar from "../components/food/menu/FoodMenuBar";
import "../styles/Food.scss";
import { RecipeContext } from "../context/RecipeProvider";
const FoodContent = lazy(() => import("../components/food/FoodContent"));

const Food = () => {
	const [categories, setCategories] = useState([]);
	const [meals, setMeals] = useState([]);
	const { recipes } = useContext(RecipeContext);
	const navigate = useNavigate();
	const location = useLocation();
	const [selectedOptions, setSelectedOptions] = useState({
		categoryId:
			new URLSearchParams(location.search).get("categories") || "",
		mealId: new URLSearchParams(location.search).get("meals") || "",
	});
	const handleCategoryClick = (categoryId) => {
		setSelectedOptions((prevOptions) => ({
			...prevOptions,
			categoryId: categoryId,
		}));
	};

	const handleMealClick = (mealId) => {
		setSelectedOptions((prevOptions) => ({
			...prevOptions,
			mealId: mealId,
		}));
	};
	const handleMenuAllClick = (name) => {
		setSelectedOptions((prevOptions) => ({
			...prevOptions,
			[name]: "",
		}));
	};
	useEffect(() => {
		const params = new URLSearchParams();

		if (selectedOptions.categoryId) {
			params.set("categories", selectedOptions.categoryId);
		}

		if (selectedOptions.mealId) {
			params.set("meals", selectedOptions.mealId);
		}
		console.log(selectedOptions);

		const newUrl = `/food?${params.toString()}`;
		navigate(newUrl);
	}, [selectedOptions, navigate]);

	useEffect(() => {
		const fetchCategories = async () => {
			const response = await axios.get("/category");
			setCategories(response.data.categories);
		};
		const fetchMeals = async () => {
			const response = await axios.get("/meal");
			setMeals(response.data.meals);
		};
		fetchCategories();
		fetchMeals();
	}, []);
	return (
		<Container fluid className="my-3">
			<Row>
				<Col md={3}>
					<FoodMenuBar
						categoryId={selectedOptions.categoryId}
						mealId={selectedOptions.mealId}
						categories={categories}
						meals={meals}
						onCategoryClick={handleCategoryClick}
						onMealClick={handleMealClick}
						onMenuAllClick={handleMenuAllClick}
					/>
				</Col>
				<Col md={9}>
					<Suspense
						fallback={
							<div className="app__loaderContainer">
								<div className="app__loader"></div>
							</div>
						}
					>
						<FoodContent
							recipes={recipes}
							categoryId={selectedOptions.categoryId}
							mealId={selectedOptions.mealId}
						/>
					</Suspense>
				</Col>
			</Row>
		</Container>
	);
};

export default Food;
