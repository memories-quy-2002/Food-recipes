import {
	FaFacebook,
	FaInstagram,
	FaLinkedin,
	FaYoutube,
} from "react-icons/fa6";
export const website_content = {
	about: "Welcome to Food Recipes, a website dedicated to sharing delicious and healthy recipes from around the world. Our team of passionate chefs and food lovers are here to inspire you to cook and enjoy food. Whether you are looking for breakfast, lunch, dinner, or dessert ideas, we have something for you.",
	contact: {
		email: "foodrecipes@example.com",
		phone: "(+84) 123 456 7890",
		address: "123 ABC St, Ho Chi Minh City, Vietnam",
	},
	overview: ["Home", "Food", "Wishlist", "About", "Contact", "Support"],
	follow: [
		<FaFacebook color="white" size={24} />,
		<FaInstagram color="white" size={24} />,
		<FaLinkedin color="white" size={24} />,
		<FaYoutube color="white" size={24} />,
	],
	bottom: "Food Recipe. Built with ReactJS, NodeJS and Express.",
};
