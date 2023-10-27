import React from "react";
import FoodCardList from "../components/home/FoodCardList";
import HomeSearchBar from "../components/home/HomeSearchBar";
import SlideShow from "../components/home/SlideShow";
import Layout from "../components/layout/Layout";
import "../styles/Home.scss";

const items = [
	{
		id: 1,
		imgSrc: "breakfast",
		title: "Breakfast",
		desc: "Breakfast is the most important meal of the day. It provides your body with the energy it needs to start the day off right. Skipping breakfast can lead to a number of problems, including fatigue, difficulty concentrating, and overeating later in the day.",
	},
	{
		id: 2,
		imgSrc: "lunch",
		title: "Lunch",
		desc: "Lunch food is the most important meal of the day. It gives you the energy you need to power through the afternoon and helps you stay focused and productive. But with so many different lunch options available, it can be tough to know what to choose",
	},
	{
		id: 3,
		imgSrc: "dinner",
		title: "Dinner",
		desc: "Dinner is the most important meal of the day, and it's important to make sure you're eating something healthy and satisfying",
	},
	{
		id: 4,
		imgSrc: "desert",
		title: "Desert",
		desc: "Desert food is often associated with indulgence and unhealthy eating, but this doesn't have to be the case. In fact, many desert foods are packed with nutrients and can be a healthy part of your diet.",
	},
];

const Home = () => {
	return (
		<Layout>
			<div className="container-fluid home">
				<SlideShow items={items} />

				<div className="home__main">
					<div className="home__main__title">
						<h3>Find your recipes</h3>
					</div>
					<HomeSearchBar />

					<FoodCardList />
				</div>
			</div>
		</Layout>
	);
};

export default Home;
