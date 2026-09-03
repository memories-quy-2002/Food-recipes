import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { isAxiosError } from "axios";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Label from "@/shared/ui/Label";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { authActions } from "@/features/auth/state/authSlice";
import { useToast } from "@/app/ToastProvider";
import type { ProfileUser } from "./profileTypes";

const fieldClass = "grid gap-2";
type ProfileField = "name" | "address" | "phoneNumber";
type ProfileForm = Record<ProfileField, string>;
type PersonalInfoProps = { user: ProfileUser | null | undefined };

const getApiErrorMessage = (error: unknown): string => {
	if (!isAxiosError(error)) return "Please try again.";
	const data = error.response?.data;
	return typeof data === "object" && data !== null && "message" in data && typeof data.message === "string" ? data.message : "Please try again.";
};

const getFormData = (user: ProfileUser | null | undefined): ProfileForm => ({
	name: user?.full_name || "",
	address: user?.address || "",
	phoneNumber: user?.phone || "",
});

const PersonalInfo = ({ user }: PersonalInfoProps): ReactElement => {
	const [formData, setFormData] = useState<ProfileForm>(() => getFormData(user));
	const [initialFormData, setInitialFormData] = useState<ProfileForm>(() => getFormData(user));
	const [isSaving, setIsSaving] = useState(false);
	const dispatch = useDispatch();
	const { showToast } = useToast();
	const isDirty = (Object.keys(formData) as ProfileField[]).some((field) => formData[field] !== initialFormData[field]);

	useEffect(() => {
		const nextFormData = getFormData(user);
		setFormData(nextFormData);
		setInitialFormData(nextFormData);
	}, [user?.user_id]);

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = event.target;
		if (!(name === "name" || name === "address" || name === "phoneNumber")) return;
		setFormData((current) => ({ ...current, [name]: value }));
	};
	const handleCancel = (): void => setFormData(initialFormData);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		if (!isDirty || isSaving) return;
		setIsSaving(true);
		try {
			const response = await axios.put<ProfileUser>(apiRoutes.userProfile, formData);
			if (response.status === 200) {
				const updatedUser = response.data;
				const nextFormData = getFormData(updatedUser);
				dispatch(authActions.updateUser({ user: updatedUser }));
				setFormData(nextFormData);
				setInitialFormData(nextFormData);
				showToast({ title: "Profile updated" });
			}
		} catch (error: unknown) {
			showToast({ title: "Couldn’t update your profile", message: getApiErrorMessage(error), type: "error" });
		} finally {
			setIsSaving(false);
		}
	};
	return (
		<div className="mx-auto max-w-3xl">
			<header className="mb-7">
				<h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Personal info</h1>
				<p className="sr-only">Keep the details that personalize your Food Recipes experience up to date.</p>
			</header>
			<form onSubmit={handleSubmit} className="grid gap-5">
				<div className={fieldClass}><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" name="name" autoComplete="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" /></div>
				<div className={fieldClass}><Label htmlFor="profile-email">Email</Label><Input id="profile-email" type="email" autoComplete="email" value={user?.email || ""} readOnly aria-describedby="profile-email-note" className="bg-muted" /><p id="profile-email-note" className="text-sm text-muted-foreground">Email is managed as your account identity.</p></div>
				<div className={fieldClass}><Label htmlFor="profile-phone">Phone number</Label><Input id="profile-phone" type="tel" name="phoneNumber" autoComplete="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Enter your phone number" /></div>
				<div className={fieldClass}><Label htmlFor="profile-address">Address</Label><Input id="profile-address" name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange} placeholder="Enter your address" /></div>
				<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
					{isDirty && <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" disabled={isSaving} onClick={handleCancel}>Cancel</Button>}
					<Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!isDirty || isSaving}>{isSaving ? "Saving…" : "Save changes"}</Button>
				</div>
			</form>
		</div>
	);
};
export default PersonalInfo;
