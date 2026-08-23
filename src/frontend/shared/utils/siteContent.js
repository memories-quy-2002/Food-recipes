import {
	FaFacebook,
	FaInstagram,
	FaLinkedin,
	FaYoutube,
} from "react-icons/fa6";

export const siteContent = {
	about:
		"Welcome to Food Recipes, a website dedicated to sharing delicious and healthy recipes from around the world. Our team of passionate chefs and food lovers are here to inspire you to cook and enjoy food. Whether you are looking for breakfast, lunch, dinner, or dessert ideas, we have something for you.",
	contact: {
		email: "foodrecipes@example.com",
		phone: "(+84) 123 456 7890",
		address: "123 ABC Street, Tan Thoi Hiep Ward, Ho Chi Minh City, Vietnam",
	},
	primaryNavigation: [
		{ title: "Home", href: "/" },
		{ title: "Recipes", href: "/food" },
		{ title: "Saved", href: "/wishlist" },
	],
	secondaryNavigation: [
		{ title: "News", href: "/news" },
		{ title: "About", href: "/about" },
	],
	follow: [
		{
			href: "https://www.facebook.com",
			label: "Facebook",
			Icon: FaFacebook,
		},
		{
			href: "https://www.youtube.com",
			label: "YouTube",
			Icon: FaYoutube,
		},
		{
			href: "https://www.instagram.com",
			label: "Instagram",
			Icon: FaInstagram,
		},
		{
			href: "https://www.linkedin.com",
			label: "LinkedIn",
			Icon: FaLinkedin,
		},
	],
	bottom: "Food Recipe. Built with ReactJS, NestJS and PostgreSQL.",
};
