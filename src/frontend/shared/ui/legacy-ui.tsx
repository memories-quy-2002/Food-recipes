import React from "react";
import ButtonPrimitive, {
	type ButtonVariant,
} from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";
type ColSpan = number | boolean | "auto";
type LayoutElementProps = React.HTMLAttributes<HTMLElement> & {
	as?: React.ElementType;
};

const BREAKPOINT_WIDTHS: Record<Breakpoint, Record<number, string>> = {
	xs: {
		1: "w-1/12", 2: "w-2/12", 3: "w-3/12", 4: "w-4/12", 5: "w-5/12", 6: "w-6/12",
		7: "w-7/12", 8: "w-8/12", 9: "w-9/12", 10: "w-10/12", 11: "w-11/12", 12: "w-full",
	},
	sm: {
		1: "sm:w-1/12", 2: "sm:w-2/12", 3: "sm:w-3/12", 4: "sm:w-4/12", 5: "sm:w-5/12", 6: "sm:w-6/12",
		7: "sm:w-7/12", 8: "sm:w-8/12", 9: "sm:w-9/12", 10: "sm:w-10/12", 11: "sm:w-11/12", 12: "sm:w-full",
	},
	md: {
		1: "md:w-1/12", 2: "md:w-2/12", 3: "md:w-3/12", 4: "md:w-4/12", 5: "md:w-5/12", 6: "md:w-6/12",
		7: "md:w-7/12", 8: "md:w-8/12", 9: "md:w-9/12", 10: "md:w-10/12", 11: "md:w-11/12", 12: "md:w-full",
	},
	lg: {
		1: "lg:w-1/12", 2: "lg:w-2/12", 3: "lg:w-3/12", 4: "lg:w-4/12", 5: "lg:w-5/12", 6: "lg:w-6/12",
		7: "lg:w-7/12", 8: "lg:w-8/12", 9: "lg:w-9/12", 10: "lg:w-10/12", 11: "lg:w-11/12", 12: "lg:w-full",
	},
	xl: {
		1: "xl:w-1/12", 2: "xl:w-2/12", 3: "xl:w-3/12", 4: "xl:w-4/12", 5: "xl:w-5/12", 6: "xl:w-6/12",
		7: "xl:w-7/12", 8: "xl:w-8/12", 9: "xl:w-9/12", 10: "xl:w-10/12", 11: "xl:w-11/12", 12: "xl:w-full",
	},
};

const getWidthClass = (breakpoint: Breakpoint, value: ColSpan): string => {
	if (value === true || value === "auto") {
		return breakpoint === "xs" ? "w-auto" : `${breakpoint}:w-auto`;
	}
	return typeof value === "number" ? BREAKPOINT_WIDTHS[breakpoint][value] ?? "" : "";
};

export const Container = React.forwardRef<
	HTMLElement,
	LayoutElementProps & { fluid?: boolean }
>(
	({ as: Component = "div", fluid = false, className, ...props }, ref) => (
		<Component
			ref={ref}
			className={cn("w-full px-3 sm:px-4", !fluid && "mx-auto max-w-7xl", className)}
			{...props}
		/>
	),
);
Container.displayName = "Container";

export const Row = React.forwardRef<HTMLElement, LayoutElementProps>(
	({ as: Component = "div", className, ...props }, ref) => (
		<Component ref={ref} className={cn("flex min-w-0 flex-wrap", className)} {...props} />
	),
);
Row.displayName = "Row";

export type ColProps = LayoutElementProps & {
	xs?: ColSpan;
	sm?: ColSpan;
	md?: ColSpan;
	lg?: ColSpan;
	xl?: ColSpan;
	xxl?: ColSpan;
};

export const Col = React.forwardRef<HTMLElement, ColProps>(
	(
		{
			as: Component = "div",
			xs,
			sm,
			md,
			lg,
			xl,
			xxl: _xxl,
			className,
			...props
		},
		ref,
	) => {
		const hasSizing = [xs, sm, md, lg, xl].some(
			(value) => value !== undefined,
		);
		return (
			<Component
				ref={ref}
				className={cn(
					"min-w-0 px-2",
					!hasSizing && "min-w-0 flex-1",
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
	},
);
Col.displayName = "Col";

const mapButtonVariant = (variant: string | undefined): ButtonVariant => {
	if (!variant || variant === "primary" || variant === "dark") return "default";
	if (variant === "danger") return "destructive";
	if (variant === "secondary" || variant === "light") return "secondary";
	if (variant === "link") return "link";
	if (variant.startsWith("outline")) return "outline";
	return "default";
};

type LegacyButtonProps = Omit<
	React.ComponentPropsWithoutRef<typeof ButtonPrimitive>,
	"variant" | "size"
> & {
	variant?: string;
	size?: string;
};

export const Button = React.forwardRef<HTMLButtonElement, LegacyButtonProps>(
	({ variant, size, className, ...props }, ref) => (
		<ButtonPrimitive
			ref={ref}
			variant={mapButtonVariant(variant)}
			size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
			className={className}
			{...props}
		/>
	),
);
Button.displayName = "Button";

const FormRoot = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
	({ className, ...props }, ref) => <form ref={ref} className={className} {...props} />,
);
FormRoot.displayName = "Form";

type FormGroupProps = React.HTMLAttributes<HTMLElement> & {
	as?: React.ElementType;
};

const FormGroup = React.forwardRef<HTMLElement, FormGroupProps>(
	({ as: Component = "div", className, ...props }, ref) => (
		<Component ref={ref} className={cn("min-w-0", className)} {...props} />
	),
);
FormGroup.displayName = "Form.Group";

const FormLabel = React.forwardRef<
	HTMLLabelElement,
	React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
	<label
		ref={ref}
		className={cn("mb-1 block text-sm font-semibold text-foreground", className)}
		{...props}
	/>
));
FormLabel.displayName = "Form.Label";

type LegacyFormControlProps = React.InputHTMLAttributes<HTMLInputElement> & {
	as?: React.ElementType;
	isInvalid?: boolean;
	isValid?: boolean;
	plaintext?: boolean;
};

const LegacyFormControlBase = React.forwardRef<HTMLElement, LegacyFormControlProps>(
	(
		{
			as: Component = "input",
			isInvalid = false,
			isValid = false,
			plaintext = false,
			className,
			...props
		},
		ref,
	) => (
		<Component
			ref={ref}
			className={cn(
				"flex min-h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base leading-6 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
				plaintext && "border-transparent bg-transparent px-0 shadow-none",
				isInvalid && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25",
				isValid && "border-emerald-600 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20",
				className,
			)}
			{...props}
		/>
	),
);
LegacyFormControlBase.displayName = "Form.Control";

const FormSelect = React.forwardRef<
	HTMLSelectElement,
	React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
	<select
		ref={ref}
		className={cn(
			"flex min-h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base leading-6 text-foreground shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
			className,
		)}
		{...props}
	/>
));
FormSelect.displayName = "Form.Select";

const FormCheck = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }
>(
	({ id, label, className, type = "checkbox", ...props }, ref) => (
		<label
			htmlFor={id}
			className={cn("inline-flex items-center gap-2 text-sm text-foreground", className)}
		>
			<input
				ref={ref}
				id={id}
				type={type}
				className="size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
				{...props}
			/>
			{label != null && <span>{label}</span>}
		</label>
	),
);
FormCheck.displayName = "Form.Check";

const FormText = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
	({ className, ...props }, ref) => (
		<small ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
	),
);
FormText.displayName = "Form.Text";

const FormFeedback = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { type?: "invalid" | "valid" }
>(({ type = "invalid", className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"mt-1 text-sm font-medium",
			type === "valid" ? "text-emerald-700" : "text-destructive",
			className,
		)}
		{...props}
	/>
));
FormFeedback.displayName = "Form.Control.Feedback";

const FormControl = Object.assign(LegacyFormControlBase, {
	Feedback: FormFeedback,
});

export const Form = Object.assign(FormRoot, {
	Group: FormGroup,
	Label: FormLabel,
	Control: FormControl,
	Select: FormSelect,
	Check: FormCheck,
	Text: FormText,
});

type PaginationButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	active?: boolean;
};

const PaginationButton = React.forwardRef<
	HTMLButtonElement,
	PaginationButtonProps
>(
	({ active = false, disabled = false, className, children, ...props }, ref) => (
		<button
			ref={ref}
			type="button"
			disabled={disabled}
			aria-current={active ? "page" : undefined}
			className={cn(
				"inline-flex size-11 items-center justify-center rounded-md border border-input bg-background text-sm font-semibold text-foreground transition hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-45",
				active && "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	),
);
PaginationButton.displayName = "Pagination.Item";

const PaginationRoot = React.forwardRef<
	HTMLElement,
	React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
	<nav
		ref={ref}
		aria-label="Pagination"
		className={cn("flex items-center gap-1", className)}
		{...props}
	>
		{children}
	</nav>
));
PaginationRoot.displayName = "Pagination";

export const Pagination = Object.assign(PaginationRoot, {
	Item: PaginationButton,
	First: React.forwardRef<HTMLButtonElement, PaginationButtonProps>((props, ref) => (
		<PaginationButton ref={ref} {...props}>«</PaginationButton>
	)),
	Prev: React.forwardRef<HTMLButtonElement, PaginationButtonProps>((props, ref) => (
		<PaginationButton ref={ref} {...props}>‹</PaginationButton>
	)),
	Next: React.forwardRef<HTMLButtonElement, PaginationButtonProps>((props, ref) => (
		<PaginationButton ref={ref} {...props}>›</PaginationButton>
	)),
	Last: React.forwardRef<HTMLButtonElement, PaginationButtonProps>((props, ref) => (
		<PaginationButton ref={ref} {...props}>»</PaginationButton>
	)),
	Ellipsis: (): React.ReactElement => (
		<span className="inline-flex size-10 items-center justify-center text-muted-foreground">…</span>
	),
});

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
	variant?: string;
};

export const Alert = ({
	variant = "danger",
	className,
	...props
}: AlertProps): React.ReactElement => (
	<div
		role="alert"
		className={cn(
			"rounded-md border px-4 py-3 text-sm",
			variant === "danger"
				? "border-destructive/30 bg-destructive/10 text-destructive"
				: "border-border bg-muted text-foreground",
			className,
		)}
		{...props}
	/>
);
