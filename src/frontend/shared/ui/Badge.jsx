import React from "react";
import { cn } from "@/shared/lib/utils";

const variants = {
	default: "bg-primary text-primary-foreground",
	secondary: "bg-secondary text-secondary-foreground",
	success: "bg-secondary text-secondary-foreground",
	warning: "bg-accent text-accent-foreground",
	outline: "border border-border bg-background text-foreground",
};
const Badge = ({ variant = "default", className, ...props }) => (
	<span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", variants[variant] || variants.default, className)} {...props} />
);
export default Badge;
