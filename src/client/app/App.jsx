import React from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.scss";
import AppRoutes from "./AppRoutes";
import AuthProvider from "./AuthProvider";
import RecipeProvider from "./RecipeProvider";
import Layout from "@/shared/layout/Layout";

function App() {
	return (
		<AuthProvider>
			<RecipeProvider>
				<BrowserRouter>
					<Layout>
						<AppRoutes />
					</Layout>
				</BrowserRouter>
			</RecipeProvider>
		</AuthProvider>
	);
}

export default App;
