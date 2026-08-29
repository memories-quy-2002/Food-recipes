import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "@/app/App";
import store from "@/app/store";
import "@/app/index.css";
import "@/app/food-recipes-design.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("The application root element is missing.");

const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</React.StrictMode>,
);
