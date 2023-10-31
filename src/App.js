import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.scss";
import RecipeProvider from "./client/context/RecipeProvider";
import Account from "./client/pages/Account";
import Food from "./client/pages/Food";
import Home from "./client/pages/Home";
import Profile from "./client/pages/Profile";
import Recipe from "./client/pages/Recipe";
import Setting from "./client/pages/Setting";
import Wishlist from "./client/pages/Wishlist";

function App() {
	return (
		<RecipeProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/food" element={<Food />} />
					<Route path="/account" element={<Account />} />
					<Route path="/profile" element={<Profile />} />
					<Route path="/recipe" element={<Recipe />} />
					<Route path="/wishlist" element={<Wishlist />} />
					<Route path="/setting" element={<Setting />} />
				</Routes>
			</BrowserRouter>
		</RecipeProvider>
	);
}

export default App;
