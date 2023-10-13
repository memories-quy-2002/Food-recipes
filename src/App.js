import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.scss";
import About from "./client/pages/About";
import Account from "./client/pages/Account";
import Contact from "./client/pages/Contact";
import Home from "./client/pages/Home";
import { useEffect, useState } from "react";
import axios from "axios";
function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/about" element={<About />} />
				<Route path="/contact" element={<Contact />} />
				<Route path="/account" element={<Account />} />
			</Routes>
		</BrowserRouter>

	);
}

export default App;
