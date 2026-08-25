import React, { useState } from "react";
import * as Yup from "yup";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Label from "@/shared/ui/Label";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { useToast } from "@/app/ToastProvider";

const ChangePassword = () => {
	const [formPassword, setFormPassword] = useState({ current: "", new: "", confirmNew: "" });
	const [errors, setErrors] = useState([]);
	const [disabled, setDisabled] = useState(true);
	const { showToast } = useToast();
	const handleInputChange = ({ target: { name, value } }) => { setDisabled(false); setErrors([]); setFormPassword((current) => ({ ...current, [name]: value })); };
	const handleSubmit = async (event) => {
		event.preventDefault();
		const schema = Yup.object().shape({
			current: Yup.string().min(8, "Password must be at least 8 characters").required("Current password is required"),
			new: Yup.string().min(8, "Password must be at least 8 characters").required("New password is required"),
			confirmNew: Yup.string().oneOf([Yup.ref("new"), null], "New passwords must match").required("Confirm password is required"),
		});
		try {
			await schema.validate(formPassword, { abortEarly: false });
			const response = await axios.put(apiRoutes.userPassword, { currentPassword: formPassword.current, newPassword: formPassword.new });
			if (response.status === 200) {
				setDisabled(true);
				setFormPassword({ current: "", new: "", confirmNew: "" });
				showToast({ title: "Password updated" });
			}
		} catch (err) {
			if (err?.errors) setErrors(err.errors);
			else if (err.response?.status === 401) setErrors([err.response.data.message]);
			else { console.error("An error occurred:", err.message); setErrors(["Unable to update your password right now."]); showToast({ title: "Couldn’t update your password", message: "Please try again.", type: "error" }); }
		}
	};
	return (
		<div className="mx-auto max-w-3xl">
			<header className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Security</p><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Change password</h1><p className="mt-3 leading-7 text-muted-foreground">Use at least 8 characters and choose a password you do not reuse elsewhere.</p></header>
		<form onSubmit={handleSubmit} className="grid gap-5">
			{[["current","Current password"],["new","New password"],["confirmNew","Confirm new password"]].map(([name,label]) => <div className="grid gap-2" key={name}><Label htmlFor={`password-${name}`}>{label}</Label><Input id={`password-${name}`} type="password" name={name} autoComplete={name === "current" ? "current-password" : "new-password"} value={formPassword[name]} onChange={handleInputChange} /></div>)}
			{errors.length > 0 && <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"><ul className="list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
			<div className="flex justify-end pt-2"><Button type="submit" size="lg" className="w-full sm:w-auto" disabled={disabled}>Save new password</Button></div>
		</form>
		</div>
	);
};
export default ChangePassword;
