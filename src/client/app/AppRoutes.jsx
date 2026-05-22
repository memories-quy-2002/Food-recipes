import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import Account from "@/features/auth/Account";
import About from "@/features/content/About";
import News from "@/features/content/News";
import Health from "@/features/diagnostics/Health";
import Food from "@/features/food/Food";
import Home from "@/features/home/Home";
import AddRecipe from "@/features/recipes/AddRecipe";
import Profile from "@/features/profile/Profile";
import Wishlist from "@/features/wishlist/Wishlist";

const Recipe = lazy(() => import("@/features/recipes/Recipe"));
const isLocalHealthEnabled = import.meta.env.DEV;

const AppRoutes = () => (
	<Routes>
		<Route path="/" element={<Home />} />
		<Route path="/food" element={<Food />} />
		<Route path="/news" element={<News />} />
		<Route path="/about" element={<About />} />
		{isLocalHealthEnabled && <Route path="/health" element={<Health />} />}
		<Route path="/account" element={<Account />} />
		<Route
			path="/profile"
			element={
				<ProtectedRoute>
					<Profile />
				</ProtectedRoute>
			}
		/>
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
		<Route
			path="/wishlist"
			element={
				<ProtectedRoute>
					<Wishlist />
				</ProtectedRoute>
			}
		/>
		<Route
			path="/food/add"
			element={
				<ProtectedRoute>
					<AddRecipe />
				</ProtectedRoute>
			}
		/>
	</Routes>
);

export default AppRoutes;
