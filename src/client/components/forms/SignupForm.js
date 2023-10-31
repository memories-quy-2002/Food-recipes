import React from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import useSignupForm from "../../hooks/useSignupForm";
const SignupForm = ({ onLogin }) => {
	const [
		formData,
		validated,
		errors,
		handleName,
		handleChange,
		handleSubmit,
	] = useSignupForm();

	return (
		<div className="form__signup">
			<Form
				noValidate
				validated={validated}
				onSubmit={handleSubmit}
				className="form__signup__container"
			>
				<h3 className="form__signup__container__title">Get started</h3>
				<Row className="form__signup__container__nameGroup">
					<Form.Group
						as={Col}
						className="form__signup__container__name"
					>
						<Form.Label className="form__signup__container__label ">
							First name{" "}
							<span className="form__signup__container__label--required">
								*
							</span>
						</Form.Label>
						<Form.Control
							className="form__signup__container__input"
							type="text"
							name="first"
							required
							aria-required
							placeholder="First name"
							value={formData.name.first}
							onChange={handleName}
						/>
					</Form.Group>

					<Form.Group
						as={Col}
						className="form__signup__container__name"
					>
						<Form.Label className="form__signup__container__label">
							Last name{" "}
							<span className="form__signup__container__label--required">
								*
							</span>
						</Form.Label>
						<Form.Control
							className="form__signup__container__input"
							type="text"
							name="last"
							required
							aria-required
							placeholder="Last name"
							value={formData.name.last}
							onChange={handleName}
						/>
					</Form.Group>
				</Row>

				<Form.Group className="form__signup__container__email">
					<Form.Label className="form__signup__container__label">
						Email address{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__signup__container__input"
						type="email"
						name="email"
						required
						aria-required
						placeholder="Email"
						value={formData.email}
						onChange={handleChange}
					/>
				</Form.Group>
				<Form.Group className="form__signup__container__pwd">
					<Form.Label className="form__signup__container__label">
						Password{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__signup__container__input"
						type="password"
						name="password"
						required
						aria-required
						placeholder="Password"
						value={formData.password}
						onChange={handleChange}
					/>
				</Form.Group>
				<Form.Group className="form__signup__container__pwd">
					<Form.Label className="form__signup__container__label">
						Confirm password{" "}
						<span className="form__signup__container__label--required">
							*
						</span>
					</Form.Label>
					<Form.Control
						className="form__signup__container__input"
						type="password"
						name="confirmPassword"
						required
						aria-required
						placeholder="Confirm Password"
						value={formData.confirmPassword}
						onChange={handleChange}
					/>
				</Form.Group>
				<Button
					type="submit"
					className="form__signup__container__submit"
				>
					Sign Up
				</Button>

				{validated && (
					<p style={{ color: "green" }}>
						Form submitted successfully!
					</p>
				)}

				{errors.length > 0 && (
					<div className="alert alert-danger text-center">
						{errors.map((error) => (
							<p key={error}>{error}</p>
						))}
					</div>
				)}
				<div className="form__signup__container__bottom">
					<p>
						Already have an account?{" "}
						<span
							onClick={onLogin}
							className="form__signup__container__bottom__button"
						>
							Log in
						</span>
					</p>
				</div>
			</Form>
		</div>
	);
};

export default SignupForm;
