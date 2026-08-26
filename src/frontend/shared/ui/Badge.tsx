import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export type BadgeVariant =
	| "default"
	| "secondary"
	| "success"
	| "warning"
	| "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
	default: "bg-primary text-primary-foreground",
	secondary: "bg-secondary text-secondary-foreground",
	success: "bg-secondary text-secondary-foreground",
	warning: "bg-accent text-accent-foreground",
	outline: "border border-border bg-background text-foreground",
};

const Badge = ({
	variant = "default",
	className,
	...props
}: BadgeProps): React.ReactElement => (
	<span
		className={cn(
			"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
			variants[variant] || variants.default,
			className,
		)}
		{...props}
	/>
);

export default Badge;
