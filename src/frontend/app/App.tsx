import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import AuthProvider from "./AuthProvider";
import ToastProvider from "./ToastProvider";
import Layout from "@/shared/layout/Layout";
import { queryClient } from "@/shared/api/queryClient";

const App = (): React.ReactElement => (
	<QueryClientProvider client={queryClient}>
		<AuthProvider>
				<ToastProvider>
					<BrowserRouter>
						<Layout>
							<AppRoutes />
						</Layout>
					</BrowserRouter>
				</ToastProvider>
		</AuthProvider>
	</QueryClientProvider>
);

export default App;
