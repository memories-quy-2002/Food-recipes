import React from "react";
import { cn } from "@/shared/lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
	<input
		ref={ref}
		type={type}
		className={cn(
			"flex min-h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base leading-6 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
			className,
		)}
		{...props}
	/>
));
Input.displayName = "Input";
export default Input;
