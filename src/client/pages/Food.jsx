import React, { Suspense, lazy, useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import FoodMenuBar from "../components/food/FoodMenuBar";
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
		categoryId:
			new URLSearchParams(location.search).get("categories") || "",
		mealId: new URLSearchParams(location.search).get("meals") || "",
		q: new URLSearchParams(location.search).get("q") || "",
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

		const newUrl = `/food?${params.toString()}`;
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
						onChangeSearchTerm={handleChangeSearchTerm}
					/>
				</Col>
				<Col md={9}>
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
