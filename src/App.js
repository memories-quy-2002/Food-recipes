import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.scss";
import Layout from "./client/components/layout/Layout";
import RecipeProvider from "./client/context/RecipeProvider";
import Account from "./client/pages/Account";
import Food from "./client/pages/Food";
import Home from "./client/pages/Home";
import Profile from "./client/pages/Profile";
import Wishlist from "./client/pages/Wishlist";
import AuthProvider from "./client/context/AuthProvider";
import AddRecipe from "./client/components/food/AddRecipe";
const Recipe = lazy(() => import("./client/pages/Recipe"));

function App() {
	return (
		<AuthProvider>
			<RecipeProvider>
				<BrowserRouter>
					<Layout>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/food" element={<Food />} />
							<Route path="/account" element={<Account />} />
							<Route path="/profile" element={<Profile />} />
							<Route
								path="/recipe"
								element={
									<Suspense
										fallback={
											<div className="loaderContainer">
												<div className="dot-elastic"></div>
											</div>
										}
									>
										<div style={{ minHeight: "100vh" }}>
											<Recipe />
										</div>
									</Suspense>
								}
							/>
							<Route path="/wishlist" element={<Wishlist />} />
							<Route path="/food/add" element={<AddRecipe />} />
						</Routes>
					</Layout>
				</BrowserRouter>
			</RecipeProvider>
		</AuthProvider>
	);
}

export default App;
