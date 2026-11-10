import { Suspense, lazy, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import ErrorPage from "@/features/content/ErrorPage";
import Food from "@/features/food/Food";
import Home from "@/features/home/Home";

const Account = lazy(() => import("@/features/auth/Account"));
const ResetPassword = lazy(() => import("@/features/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("@/features/auth/VerifyEmail"));
const Health = lazy(() => import("@/features/diagnostics/Health"));
const AddRecipe = lazy(() => import("@/features/recipes/AddRecipe"));
const EditRecipe = lazy(() => import("@/features/recipes/EditRecipe"));
const Profile = lazy(() => import("@/features/profile/Profile"));
const Wishlist = lazy(() => import("@/features/wishlist/Wishlist"));
const PlanningPage = lazy(() => import("@/features/planning/PlanningPage"));
const ShoppingListPage = lazy(() => import("@/features/shopping/ShoppingListPage"));
const PantryPage = lazy(() => import("@/features/pantry/PantryPage"));
const HistoryPage = lazy(() => import("@/features/history/HistoryPage"));
const FoodPreferencesPage = lazy(() => import("@/features/preferences/FoodPreferencesPage"));
const HouseholdsPage = lazy(() => import("@/features/households/HouseholdsPage"));
const NotificationPreferencesPage = lazy(() => import("@/features/notifications/NotificationPreferencesPage"));
const RecipeImportPage = lazy(() => import("@/features/recipe-import/RecipeImportPage"));
const JournalPage = lazy(() => import("@/features/journal/JournalPage"));
const Recipe = lazy(() => import("@/features/recipes/Recipe"));
const isLocalHealthEnabled = import.meta.env.DEV;

const AppRoutes = (): ReactElement => (
	<Suspense fallback={<div className="loaderContainer" role="status" aria-label="Loading page"><div className="dot-elastic" /></div>}>
	<Routes>
		<Route path="/" element={<Home />} />
		<Route path="/food" element={<Food />} />
		{isLocalHealthEnabled && <Route path="/health" element={<Health />} />}
		<Route path="/account" element={<Account />} />
		<Route path="/account/reset-password" element={<ResetPassword />} />
		<Route path="/account/verify-email" element={<VerifyEmail />} />
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
	</Suspense>
);

export default AppRoutes;
