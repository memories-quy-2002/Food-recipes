import { useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { isAxiosError } from "axios";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Label from "@/shared/ui/Label";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { getUpdatedProfileUser, serializeProfilePayload } from "@/shared/api/mutations";
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

const PersonalInfo = ({ user }: PersonalInfoProps): ReactElement => {
	const [formData, setFormData] = useState<ProfileForm>({ name: user?.full_name || "", address: user?.address || "", phoneNumber: user?.phone || "" });
	const [disabled, setDisabled] = useState(true);
	const dispatch = useDispatch();
	const { showToast } = useToast();
	const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = event.target;
		if (!(name === "name" || name === "address" || name === "phoneNumber")) return;
		setDisabled(false);
		setFormData((current) => ({ ...current, [name]: value }));
	};
	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		try {
			const response = await axios.put<ProfileUser>(apiRoutes.userProfile, serializeProfilePayload(formData));
			if (response.status === 200) {
				dispatch(authActions.updateUser({ user: getUpdatedProfileUser(response.data) }));
				setDisabled(true);
				showToast({ title: "Profile updated" });
			}
		} catch (error: unknown) {
			showToast({ title: "Couldn’t update your profile", message: getApiErrorMessage(error), type: "error" });
		}
	};
	return (
		<div className="mx-auto max-w-3xl">
			<header className="mb-7">
				<p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Account details</p>
				<h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Personal info</h1>
				<p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Keep the details that personalize your Food Recipes experience up to date.</p>
			</header>
			<form onSubmit={handleSubmit} className="grid gap-5">
				<div className={fieldClass}><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" name="name" autoComplete="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" /></div>
				<div className={fieldClass}><Label htmlFor="profile-phone">Phone number</Label><Input id="profile-phone" type="tel" name="phoneNumber" autoComplete="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Enter your phone number" /></div>
				<div className={fieldClass}><Label htmlFor="profile-address">Address</Label><Input id="profile-address" name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange} placeholder="Enter your address" /></div>
				<div className="flex justify-end pt-2"><Button type="submit" size="lg" className="w-full sm:w-auto" disabled={disabled}>Save changes</Button></div>
			</form>
		</div>
	);
};
export default PersonalInfo;
