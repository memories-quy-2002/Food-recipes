import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import FoodCardList from "../components/home/FoodCardList";
import HomeSearchBar from "../components/home/HomeSearchBar";
import SlideShow from "../components/home/SlideShow";
import "../styles/Home.scss";

const Home = () => {
	const [meals, setMeals] = useState([]);
	useEffect(() => {
		const fetchMeals = async () => {
			try {
				const response = await axios.get("/meal");
				setMeals(
					response.data.meals
						.filter(
							(meal, index, self) =>
								index ===
								self.findIndex((c) => c.id === meal.id)
						)
						.sort((a, b) => a.id - b.id)
				);
			} catch (err) {
				console.error(err);
			}
		};
		fetchMeals();
	}, []);
	return (
		<div className="container-fluid home">
			<SlideShow items={meals} />

			<div className="home__main">
				<div className="home__main__title">
					<h3>Find your recipes</h3>
				</div>
				<HomeSearchBar />

				<FoodCardList />
			</div>
		</div>
	);
};

export default Home;
