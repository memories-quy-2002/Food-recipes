import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import * as Yup from "yup";
import axios from "../../api/axios";
const ChangePassword = ({ user }) => {
	const [formPassword, setFormPassword] = useState({
		current: "",
		new: "",
		confirmNew: "",
	});
	const [errors, setErrors] = useState([]);
	const [disabled, setDisabled] = useState(true);
	const handleInputChange = (event) => {
		setDisabled(false);
		const { name, value } = event.target;
		setFormPassword({ ...formPassword, [name]: value });
	};
	const handleSubmit = async (event) => {
		event.preventDefault();

		const schema = Yup.object().shape({
			current: Yup.string()
				.min(8, "Password must be at least 8 characters")
				.required("Current password is required"),
			new: Yup.string()
				.min(8, "Password must be at least 8 characters")
				.required("New password is required"),
			confirmNew: Yup.string()
				.oneOf([Yup.ref("new"), null], "New passwords must match")
				.required("Confirm password is required"),
		});
		schema
			.validate(formPassword, { abortEarly: false })
			.then(async () => {
				try {
					const response = await axios.put(
						`/account/users/password/${user.user_id}`,
						{
							currentPassword: formPassword.current,
							newPassword: formPassword.new,
						}
					);

					if (response.status === 200) {
						window.location.reload(false);
					}
				} catch (err) {
					if (err.response && err.response.status === 401) {
						// Handle unauthorized error
						setErrors([err.response.data.message]);
					} else {
						// Handle other errors
						console.error("An error occurred:", err.message);
					}
				}
			})
			.catch((err) => {
				setErrors(err.errors);
			});
	};

	return (
		<div className="profile__container__main__change">
			<h2 className="profile__container__main__change__title">
				Change password
			</h2>
			<p>
				If you want to change your password, please fill all the fields
				below and click the submit button
			</p>
			<div>
				<Form
					onSubmit={handleSubmit}
					className="profile__container__main__change__form"
				>
					<Form.Group
						controlId="formCurrentPassword"
						className="profile__container__main__change__form__field"
					>
						<Form.Label>Current Password</Form.Label>
						<Form.Control
							type="password"
							name="current"
							value={formPassword.current}
							onChange={handleInputChange}
						/>
					</Form.Group>
					<Form.Group
						controlId="formNewPassword"
						className="profile__container__main__change__form__field"
					>
						<Form.Label>New Password</Form.Label>
						<Form.Control
							type="password"
							name="new"
							value={formPassword.new}
							onChange={handleInputChange}
						/>
					</Form.Group>
					<Form.Group
						controlId="formConfirmNewPassword"
						className="profile__container__main__change__form__field"
					>
						<Form.Label>Confirm New Password</Form.Label>
						<Form.Control
							type="password"
							name="confirmNew"
							value={formPassword.confirmNew}
							onChange={handleInputChange}
						/>
					</Form.Group>
					{errors.map((error, index) => (
						<div className="text-danger" key={index}>
							{error}
						</div>
					))}
					<div style={{ textAlign: "right" }}>
						<Button
							type="submit"
							className="profile__container__main__change__form__button"
							disabled={disabled}
						>
							Save Changes
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
};

export default ChangePassword;
