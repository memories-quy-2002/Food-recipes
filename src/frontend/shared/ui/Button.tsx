import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

export type ButtonVariant =
	| "default"
	| "destructive"
	| "outline"
	| "secondary"
	| "ghost"
	| "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps
	 extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const buttonVariants = cva(
	"inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
				outline:
					"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-11 px-4 py-2",
				sm: "h-11 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "size-11",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			type = "button",
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";

		return (
			<Comp
				data-slot="button"
				className={cn(buttonVariants({ variant, size }), className)}
				{...(!asChild && { type })}
				{...props}
				ref={ref}
			/>
		);
	},
);

Button.displayName = "Button";

export default Button;
