import "./App.scss";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./client/pages/Home";
import About from "./client/pages/About";
import Contact from "./client/pages/Contact";
import Login from "./client/pages/Login";
import Signup from "./client/pages/Signup";
function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/about" element={<About />} />
				<Route path="/contact" element={<Contact />} />
				<Route path="/login" element={<Login />} />
				<Route path="/signup" element={<Signup />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
