import { Suspense, lazy, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import Account from "@/features/auth/Account";
import ErrorPage from "@/features/content/ErrorPage";
import Health from "@/features/diagnostics/Health";
import Food from "@/features/food/Food";
import Home from "@/features/home/Home";
import AddRecipe from "@/features/recipes/AddRecipe";
import EditRecipe from "@/features/recipes/EditRecipe";
import Profile from "@/features/profile/Profile";
import Wishlist from "@/features/wishlist/Wishlist";
import PlanningPage from "@/features/planning/PlanningPage";
import ShoppingListPage from "@/features/shopping/ShoppingListPage";
import PantryPage from "@/features/pantry/PantryPage";
import HistoryPage from "@/features/history/HistoryPage";
import FoodPreferencesPage from "@/features/preferences/FoodPreferencesPage";
import HouseholdsPage from "@/features/households/HouseholdsPage";
import NotificationPreferencesPage from "@/features/notifications/NotificationPreferencesPage";
import RecipeImportPage from "@/features/recipe-import/RecipeImportPage";
import JournalPage from "@/features/journal/JournalPage";

const Recipe = lazy(() => import("@/features/recipes/Recipe"));
const isLocalHealthEnabled = import.meta.env.DEV;

const AppRoutes = (): ReactElement => (
	<Routes>
		<Route path="/" element={<Home />} />
		<Route path="/food" element={<Food />} />
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
			path="/profile/preferences"
			element={
				<ProtectedRoute>
					<FoodPreferencesPage />
				</ProtectedRoute>
			}
		/>
		<Route
			path="/households"
			element={<ProtectedRoute><HouseholdsPage /></ProtectedRoute>}
		/>
		<Route
			path="/profile/notifications"
			element={<ProtectedRoute><NotificationPreferencesPage /></ProtectedRoute>}
		/>
		<Route path="/recipes/import" element={<ProtectedRoute><RecipeImportPage /></ProtectedRoute>} />
		<Route path="/history/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
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
			path="/recipe/cooking"
			element={
				<Suspense
					fallback={
						<div className="loaderContainer">
							<div className="dot-elastic"></div>
						</div>
					}
				>
					<Recipe />
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
			path="/planning"
			element={
				<ProtectedRoute>
					<PlanningPage />
				</ProtectedRoute>
			}
		/>
		<Route
			path="/shopping-list"
			element={
				<ProtectedRoute>
					<ShoppingListPage />
				</ProtectedRoute>
			}
		/>
		<Route
			path="/pantry"
			element={
				<ProtectedRoute>
					<PantryPage />
				</ProtectedRoute>
			}
		/>
		<Route
			path="/history"
			element={
				<ProtectedRoute>
					<HistoryPage />
				</ProtectedRoute>
			}
		/>
		<Route path="/saved" element={<Navigate replace to="/wishlist" />} />
		<Route
			path="/food/add"
			element={
				<ProtectedRoute>
					<AddRecipe />
				</ProtectedRoute>
			}
		/>
		<Route
			path="/food/edit"
			element={
				<ProtectedRoute>
					<EditRecipe />
				</ProtectedRoute>
			}
		/>
		<Route path="*" element={<ErrorPage />} />
	</Routes>
);

export default AppRoutes;
