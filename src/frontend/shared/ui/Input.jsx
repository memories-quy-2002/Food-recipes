import React from "react";
import { cn } from "@/shared/lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
	<input
		ref={ref}
		type={type}
		className={cn(
			"flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		{...props}
	/>
));
Input.displayName = "Input";
export default Input;
