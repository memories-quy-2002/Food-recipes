import React from "react";
import Layout from "../components/layout/Layout";
import "../styles/Home.scss";
import FoodCardList from "../components/home/FoodCardList";
import Background from "../components/home/Background";

const Home = () => {
	return (
		<Layout>
			<div className="container-fluid home">
				<Background />

				<div className="home__main">
					<div className="home__main__title">
						<h3>Find your recipes</h3>
					</div>
					<div className="home__main__search">
						<input type="text" placeholder="Search..."></input>
					</div>
					<FoodCardList />
				</div>
			</div>
		</Layout>
	);
};

export default Home;
