import { useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import * as Yup from "yup";
import { isAxiosError } from "axios";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Label from "@/shared/ui/Label";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { useToast } from "@/app/ToastProvider";

type PasswordField = "current" | "new" | "confirmNew";
type PasswordForm = Record<PasswordField, string>;
type PasswordErrors = Partial<Record<PasswordField, string>>;

const passwordFields: Array<readonly [PasswordField, string]> = [
	["current", "Current password"],
	["new", "New password"],
	["confirmNew", "Confirm new password"],
];

const isPasswordField = (value: string): value is PasswordField =>
	passwordFields.some(([field]) => field === value);

const ChangePassword = (): ReactElement => {
	const [formPassword, setFormPassword] = useState<PasswordForm>({ current: "", new: "", confirmNew: "" });
	const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({});
	const [generalError, setGeneralError] = useState<string | null>(null);
	const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({ current: false, new: false, confirmNew: false });
	const [isSaving, setIsSaving] = useState(false);
	const { showToast } = useToast();
	const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = event.target;
		if (!isPasswordField(name)) return;
		setFieldErrors((current) => {
			const next = { ...current };
			delete next[name];
			return next;
		});
		setGeneralError(null);
		setFormPassword((current) => ({ ...current, [name]: value }));
	};
	const toggleVisibility = (field: PasswordField): void => {
		setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
	};
	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		const schema = Yup.object().shape({
			current: Yup.string().min(8, "Password must be at least 8 characters").required("Current password is required"),
			new: Yup.string().min(8, "Password must be at least 8 characters").required("New password is required"),
			confirmNew: Yup.string().oneOf([Yup.ref("new")], "New passwords must match").required("Confirm password is required"),
		});
		try {
			await schema.validate(formPassword, { abortEarly: false });
			setFieldErrors({});
			setGeneralError(null);
			setIsSaving(true);
			const response = await axios.put(apiRoutes.userPassword, { currentPassword: formPassword.current, newPassword: formPassword.new });
			if (response.status === 200) {
				setFormPassword({ current: "", new: "", confirmNew: "" });
				setVisibleFields({ current: false, new: false, confirmNew: false });
				showToast({ title: "Password updated" });
			}
		} catch (error: unknown) {
			if (error instanceof Yup.ValidationError) {
				const nextErrors: PasswordErrors = {};
				for (const validationError of error.inner.length > 0 ? error.inner : [error]) {
					if (validationError.path && isPasswordField(validationError.path)) nextErrors[validationError.path] = validationError.message;
				}
				setFieldErrors(nextErrors);
				setGeneralError(null);
			} else if (isAxiosError(error) && error.response?.status === 401 && typeof error.response.data?.message === "string") {
				setGeneralError(error.response.data.message);
			} else {
				console.error("An error occurred:", error);
				setGeneralError("Unable to update your password right now.");
				showToast({ title: "Couldn’t update your password", message: "Please try again.", type: "error" });
			}
		} finally {
			setIsSaving(false);
		}
	};
	const validationMessages = Object.values(fieldErrors).filter((message): message is string => Boolean(message));
	const hasInput = Object.values(formPassword).some(Boolean);
	return (
		<div className="mx-auto max-w-3xl">
			<header className="mb-7"><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Change password</h1><p className="mt-3 text-sm text-muted-foreground">Minimum 8 characters. Avoid reusing an old password.</p></header>
		<form onSubmit={handleSubmit} className="grid gap-5">
			{passwordFields.map(([name, label]) => {
				const errorMessage = fieldErrors[name];
				const inputId = `password-${name}`;
				const errorId = `${inputId}-error`;
				const hintId = `${inputId}-hint`;
				return <div className="grid gap-2" key={name}>
					<Label htmlFor={inputId}>{label}</Label>
					<div className="relative">
						<Input id={inputId} type={visibleFields[name] ? "text" : "password"} name={name} autoComplete={name === "current" ? "current-password" : "new-password"} value={formPassword[name]} onChange={handleInputChange} aria-invalid={Boolean(errorMessage)} aria-describedby={[name === "new" ? hintId : "", errorMessage ? errorId : ""].filter(Boolean).join(" ") || undefined} className="pr-20" />
						<button type="button" className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => toggleVisibility(name)} aria-label={`${visibleFields[name] ? "Hide" : "Show"} ${label.toLowerCase()}`}>
							{visibleFields[name] ? "Hide" : "Show"}
						</button>
					</div>
					{name === "new" && <p id={hintId} className="text-sm text-muted-foreground">Use at least 8 characters for your new password.</p>}
					{errorMessage && <p id={errorId} className="text-sm text-destructive">{errorMessage}</p>}
				</div>;
			})}
			{validationMessages.length > 0 && <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"><ul className="list-disc space-y-1 pl-5">{validationMessages.map((error) => <li key={error}>{error}</li>)}</ul></div>}
			{generalError && <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{generalError}</div>}
			<div className="flex justify-end pt-2"><Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!hasInput || isSaving}>{isSaving ? "Saving…" : "Save new password"}</Button></div>
		</form>
		</div>
	);
};
export default ChangePassword;
