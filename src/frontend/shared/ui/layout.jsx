import React from "react";
import { cn } from "@/shared/lib/utils";

const BREAKPOINT_WIDTHS = {
	xs: { 1: "w-1/12", 2: "w-2/12", 3: "w-3/12", 4: "w-4/12", 5: "w-5/12", 6: "w-6/12", 7: "w-7/12", 8: "w-8/12", 9: "w-9/12", 10: "w-10/12", 11: "w-11/12", 12: "w-full" },
	sm: { 1: "sm:w-1/12", 2: "sm:w-2/12", 3: "sm:w-3/12", 4: "sm:w-4/12", 5: "sm:w-5/12", 6: "sm:w-6/12", 7: "sm:w-7/12", 8: "sm:w-8/12", 9: "sm:w-9/12", 10: "sm:w-10/12", 11: "sm:w-11/12", 12: "sm:w-full" },
	md: { 1: "md:w-1/12", 2: "md:w-2/12", 3: "md:w-3/12", 4: "md:w-4/12", 5: "md:w-5/12", 6: "md:w-6/12", 7: "md:w-7/12", 8: "md:w-8/12", 9: "md:w-9/12", 10: "md:w-10/12", 11: "md:w-11/12", 12: "md:w-full" },
	lg: { 1: "lg:w-1/12", 2: "lg:w-2/12", 3: "lg:w-3/12", 4: "lg:w-4/12", 5: "lg:w-5/12", 6: "lg:w-6/12", 7: "lg:w-7/12", 8: "lg:w-8/12", 9: "lg:w-9/12", 10: "lg:w-10/12", 11: "lg:w-11/12", 12: "lg:w-full" },
	xl: { 1: "xl:w-1/12", 2: "xl:w-2/12", 3: "xl:w-3/12", 4: "xl:w-4/12", 5: "xl:w-5/12", 6: "xl:w-6/12", 7: "xl:w-7/12", 8: "xl:w-8/12", 9: "xl:w-9/12", 10: "xl:w-10/12", 11: "xl:w-11/12", 12: "xl:w-full" },
};

const getWidthClass = (breakpoint, value) => {
	if (value === true || value === "auto") return breakpoint === "xs" ? "w-auto" : `${breakpoint}:w-auto`;
	return BREAKPOINT_WIDTHS[breakpoint]?.[value] ?? "";
};

export const Container = React.forwardRef(({ as: Component = "div", fluid = false, className, ...props }, ref) => (
	<Component ref={ref} className={cn("w-full px-4 sm:px-6 lg:px-8", !fluid && "mx-auto max-w-7xl", className)} {...props} />
));
Container.displayName = "Container";

export const Row = React.forwardRef(({ as: Component = "div", className, ...props }, ref) => (
	<Component ref={ref} className={cn("flex min-w-0 flex-wrap", className)} {...props} />
));
Row.displayName = "Row";

export const Col = React.forwardRef(({ as: Component = "div", xs, sm, md, lg, xl, xxl: _xxl, className, ...props }, ref) => {
	const hasSizing = [xs, sm, md, lg, xl].some((value) => value !== undefined);
	return (
		<Component
			ref={ref}
			className={cn(
				"min-w-0",
				!hasSizing && "flex-1",
				xs !== undefined && getWidthClass("xs", xs),
				sm !== undefined && getWidthClass("sm", sm),
				md !== undefined && getWidthClass("md", md),
				lg !== undefined && getWidthClass("lg", lg),
				xl !== undefined && getWidthClass("xl", xl),
				className,
			)}
			{...props}
		/>
	);
});
Col.displayName = "Col";
