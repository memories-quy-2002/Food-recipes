import "./App.scss";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./client/pages/Home";
import About from "./client/pages/About";
function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/about" element={<About />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
