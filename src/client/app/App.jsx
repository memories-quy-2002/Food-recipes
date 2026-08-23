import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import "./App.scss";
import AppRoutes from "./AppRoutes";
import AuthProvider from "./AuthProvider";
import RecipeProvider from "./RecipeProvider";
import ToastProvider from "./ToastProvider";
import Layout from "@/shared/layout/Layout";
import { queryClient } from "@/shared/api/query-client";

function App() {
	return (
		<QueryClientProvider client={queryClient}>
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
		</QueryClientProvider>
	);
}

export default App;
