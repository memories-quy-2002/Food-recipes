import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import axios from "../../api/axios";
import { authActions } from "../../redux/authSlice";
const PersonalInfo = ({ user }) => {
	const [formData, setFormData] = useState({
		name: user.full_name,
		email: user.email,
		address: user.address,
		phoneNumber: user.phone,
	});
	const [disabled, setDisabled] = useState(true);
	const dispatch = useDispatch();
	const handleInputChange = (event) => {
		setDisabled(false);
		const { name, value } = event.target;
		setFormData({ ...formData, [name]: value });
	};
	const handleSubmit = async (event) => {
		event.preventDefault();
		const response = await axios.put(`account/users/${user.user_id}`, {
			formData,
		});
		if (response.status === 200) {
			dispatch(authActions.updateUser({ user: response.data.user }));
		}

		window.location.reload(false);
	};
	useEffect(() => console.log(formData), [formData]);
	return (
		<div className="profile__container__main__info">
			<h1 className="profile__container__main__info__title">
				Personal Info
			</h1>
			<p>
				These details will be used for all the Meredith profiles
				associated with your email address. By filling out this
				information, you will receive a more personalized experience
				across all Meredith websites.
			</p>

			<div className="profile__container__main__info__form">
				<Form onSubmit={handleSubmit} action="/profile" method="PUT">
					<Form.Group
						controlId="formBasicName"
						className="profile__container__main__info__form__field"
					>
						<Form.Label>Full Name</Form.Label>
						<Form.Control
							type="text"
							placeholder="Enter your full name"
							name="name"
							value={formData.name}
							onChange={handleInputChange}
						/>
					</Form.Group>

					<Form.Group
						controlId="formBasicEmail"
						className="profile__container__main__info__form__field"
					>
						<Form.Label>Email address</Form.Label>
						<Form.Control
							type="email"
							placeholder="Enter email"
							name="email"
							value={formData.email}
							onChange={handleInputChange}
						/>
					</Form.Group>

					<Form.Group
						controlId="formBasicPhoneNumber"
						className="profile__container__main__info__form__field"
					>
						<Form.Label>Phone Number</Form.Label>
						<Form.Control
							type="tel"
							placeholder="Enter your phone number"
							name="phoneNumber"
							value={formData.phoneNumber}
							onChange={handleInputChange}
						/>
					</Form.Group>

					<Form.Group
						controlId="formBasicAddress"
						className="profile__container__main__info__form__field"
					>
						<Form.Label>Address</Form.Label>
						<Form.Control
							type="text"
							placeholder="Enter your address"
							name="address"
							value={formData.address}
							onChange={handleInputChange}
						/>
					</Form.Group>
					<div style={{ textAlign: "right" }}>
						<Button
							type="submit"
							className="profile__container__main__info__form__button"
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

export default PersonalInfo;
