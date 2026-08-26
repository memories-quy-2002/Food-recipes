import React from "react";
import { cn } from "@/shared/lib/utils";

const Label = React.forwardRef<
	HTMLLabelElement,
	React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
	<label
		ref={ref}
		className={cn("text-sm font-semibold leading-none text-foreground", className)}
		{...props}
	/>
));
Label.displayName = "Label";

export default Label;
