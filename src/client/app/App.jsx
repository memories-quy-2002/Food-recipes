import React from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.scss";
import AppRoutes from "./AppRoutes";
import AuthProvider from "./AuthProvider";
import RecipeProvider from "./RecipeProvider";
import ToastProvider from "./ToastProvider";
import Layout from "@/shared/layout/Layout";

function App() {
	return (
		<AuthProvider>
			<RecipeProvider>
				<ToastProvider>
					<BrowserRouter>
						<Layout>
							<AppRoutes />
						</Layout>
					</BrowserRouter>
				</ToastProvider>
			</RecipeProvider>
		</AuthProvider>
	);
}

export default App;
