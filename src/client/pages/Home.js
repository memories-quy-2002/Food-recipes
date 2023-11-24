import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import Carousel from "../components/home/Carousel";
import HomeMain from "../components/home/HomeMain";
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
			<Carousel items={meals} />
			<HomeMain />
		</div>
	);
};

export default Home;
