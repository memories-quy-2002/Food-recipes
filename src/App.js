import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.scss";
import Account from "./client/pages/Account";
import Food from "./client/pages/Food";
import Home from "./client/pages/Home";
import Profile from "./client/pages/Profile";
import Recipe from "./client/pages/Recipe";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/food" element={<Food />} />
				<Route path="/account" element={<Account />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/recipe" element={<Recipe />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
