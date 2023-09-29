import React from "react";
import "../../styles/NavBar.scss";

const NavBar = () => {
	return (
		<nav className="navBar">
			<a href="/" className="navBar__brand">
				React
			</a>
			<button className="navBar__toggle">
				<svg
					width="90%"
					height="90%"
					viewBox="0 0 1024 1024"
					class="icon"
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M64 192h896v76.8H64V192z m0 281.6h896v76.8H64V473.6z m0 281.6h896V832H64v-76.8z"
						fill="#fff"
					/>
				</svg>
			</button>
			<div className="navBar__menu">
				<ul>
					<li>
						<a href="/">Home</a>
					</li>
					<li>
						<a href="/about">About</a>
					</li>
					<li>
						<a href="/contact">Contact</a>
					</li>
				</ul>
			</div>
		</nav>
	);
};

export default NavBar;
