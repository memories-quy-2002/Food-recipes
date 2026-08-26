import type { IconType } from "react-icons";
import {
	FaFacebook,
	FaInstagram,
	FaLinkedin,
	FaYoutube,
} from "react-icons/fa6";

export type NavigationItem = {
	title: string;
	href: string;
};

export type FollowItem = {
	href: string;
	label: string;
	Icon: IconType;
};

export type SiteContent = {
	about: string;
	contact: {
		email: string;
		phone: string;
		address: string;
	};
	primaryNavigation: NavigationItem[];
	secondaryNavigation: NavigationItem[];
	follow: FollowItem[];
	bottom: string;
};

export const siteContent: SiteContent = {
	about:
		"Practical recipes and kitchen inspiration for everyday cooking.",
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
	secondaryNavigation: [],
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
