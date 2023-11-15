import React, { useEffect, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import convertImage from "../utils/convertImage";
import "../styles/ProfileEdit.scss";

const ProfileEdit = () => {
	const user = useSelector((state) =>
		state.auth.local.user ? state.auth.local.user : state.auth.session.user
	);
	const [formData, setFormData] = useState({
		name: user.full_name,
		email: user.email,
		address: user.address,
		phoneNumber: user.phone,
		newPassword: "",
		confirmPassword: "",
	});
	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		// You can handle form submission here (e.g., send data to the server).
		console.log("Form data submitted:", formData);
	};

	return (
		<Container fluid>
			<div className="edit__container">
				<div className="edit__container__aside">
					<div className="edit__container__aside__img">
						{convertImage("avatar", "")}
					</div>
					<div className="edit__container__aside__context">
						<h5>{user.full_name}</h5>
						<p>{user.email}</p>
					</div>
				</div>
				<div className="edit__container__form">
					<h2>Profile Setting</h2>
					<Form onSubmit={handleSubmit}>
						<div className="edit__container__form__profile">
							<h5>Personal information</h5>
							<Form.Group controlId="formName">
								<Form.Label>Name</Form.Label>
								<Form.Control
									type="text"
									name="name"
									value={formData.name}
									onChange={handleInputChange}
								/>
							</Form.Group>

							<Form.Group controlId="formEmail">
								<Form.Label>Email</Form.Label>
								<Form.Control
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
								/>
							</Form.Group>

							<Form.Group controlId="formPhoneNumber">
								<Form.Label>Phone Number</Form.Label>
								<Form.Control
									type="tel"
									name="phoneNumber"
									value={formData.phoneNumber}
									onChange={handleInputChange}
								/>
							</Form.Group>

							<Form.Group controlId="formCountry">
								<Form.Label>Address</Form.Label>
								<Form.Control
									type="text"
									name="address"
									value={formData.address}
									onChange={handleInputChange}
								/>
							</Form.Group>
							<Button variant="primary" type="submit">
								Update profile
							</Button>
						</div>
						<div className="edit__container__form__password">
							<h5>Change password</h5>
							<Form onSubmit={handleSubmit}>
								<Form.Group controlId="formNewPassword">
									<Form.Label>New password</Form.Label>
									<Form.Control
										type="password"
										name="newPassword"
										value={formData.newPassword}
										onChange={handleInputChange}
									/>
								</Form.Group>

								<Form.Group controlId="formConfirmPassword">
									<Form.Label>
										Confirm new password
									</Form.Label>
									<Form.Control
										type="password"
										name="confirmPassword"
										value={formData.confirmPassword}
										onChange={handleInputChange}
									/>
								</Form.Group>
								<Button variant="primary" type="submit">
									Save Changes
								</Button>
							</Form>
						</div>
					</Form>
				</div>
			</div>
		</Container>
	);
};

export default ProfileEdit;
