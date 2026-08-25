import type * as React from "react";

export type BadgeVariant = "default" | "secondary" | "success" | "warning" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

declare const Badge: React.ComponentType<BadgeProps>;

export default Badge;
