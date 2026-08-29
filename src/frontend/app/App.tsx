import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import AuthProvider from "./AuthProvider";
import RecipeProvider from "./RecipeProvider";
import ToastProvider from "./ToastProvider";
import Layout from "@/shared/layout/Layout";
import { queryClient } from "@/shared/api/queryClient";
import { HouseholdScopeProvider } from "@/features/households/HouseholdScopeProvider";

const App = (): React.ReactElement => (
	<QueryClientProvider client={queryClient}>
		<AuthProvider>
			<HouseholdScopeProvider>
				<RecipeProvider>
					<ToastProvider>
						<BrowserRouter>
							<Layout>
								<AppRoutes />
							</Layout>
						</BrowserRouter>
					</ToastProvider>
				</RecipeProvider>
			</HouseholdScopeProvider>
		</AuthProvider>
	</QueryClientProvider>
);

export default App;
