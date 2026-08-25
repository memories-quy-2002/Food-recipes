import React, { createContext, useContext, useId } from "react";
import { cn } from "@/shared/lib/utils";

const FormGroupContext = createContext(null);

const FormRoot = React.forwardRef(({ className, ...props }, ref) => (
	<form ref={ref} className={className} {...props} />
));
FormRoot.displayName = "Form";

const FormGroup = React.forwardRef(({ as: Component = "div", controlId, className, ...props }, ref) => {
	const generatedId = useId();
	const id = controlId || generatedId;
	return (
		<FormGroupContext.Provider value={id}>
			<Component ref={ref} className={cn("min-w-0", className)} {...props} />
		</FormGroupContext.Provider>
	);
});
FormGroup.displayName = "Form.Group";

const FormLabel = React.forwardRef(({ htmlFor, className, ...props }, ref) => {
	const groupId = useContext(FormGroupContext);
	return <label ref={ref} htmlFor={htmlFor || groupId || undefined} className={cn("mb-2 block text-sm font-extrabold leading-5 text-foreground", className)} {...props} />;
});
FormLabel.displayName = "Form.Label";

const controlClass = "flex min-h-12 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base leading-6 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

const FormControl = React.forwardRef(({ as: Component = "input", id, isInvalid = false, className, ...props }, ref) => {
	const groupId = useContext(FormGroupContext);
	return <Component ref={ref} id={id || groupId || undefined} aria-invalid={isInvalid || undefined} className={cn(controlClass, Component === "textarea" && "min-h-36 resize-y py-3.5", isInvalid && "border-destructive ring-destructive/20", className)} {...props} />;
});
FormControl.displayName = "Form.Control";

const FormSelect = React.forwardRef(({ id, className, ...props }, ref) => {
	const groupId = useContext(FormGroupContext);
	return <select ref={ref} id={id || groupId || undefined} className={cn(controlClass, className)} {...props} />;
});
FormSelect.displayName = "Form.Select";

const FormCheck = React.forwardRef(({ id, label, className, type = "checkbox", ...props }, ref) => {
	const generatedId = useId();
	const inputId = id || generatedId;
	return <label htmlFor={inputId} className={cn("inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground", className)}><input ref={ref} id={inputId} type={type} className="size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />{label != null && <span>{label}</span>}</label>;
});
FormCheck.displayName = "Form.Check";

const FormText = React.forwardRef(({ className, ...props }, ref) => <small ref={ref} className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />);
FormText.displayName = "Form.Text";

const FormFeedback = React.forwardRef(({ type = "invalid", className, ...props }, ref) => <div ref={ref} role={type === "invalid" ? "alert" : undefined} className={cn("mt-2 text-sm font-semibold leading-6", type === "valid" ? "text-foreground" : "text-destructive", className)} {...props} />);
FormFeedback.displayName = "Form.Control.Feedback";
FormControl.Feedback = FormFeedback;

export const Form = Object.assign(FormRoot, {
	Group: FormGroup,
	Label: FormLabel,
	Control: FormControl,
	Select: FormSelect,
	Check: FormCheck,
	Text: FormText,
});
