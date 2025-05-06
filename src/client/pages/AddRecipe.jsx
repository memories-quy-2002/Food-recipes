import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import axios from "../api/axios";
import "../styles/AddRecipe.scss";
import convertTime from "../utils/convertTime";
import { AuthContext } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
const AddRecipe = () => {
	const { auth } = useContext(AuthContext);
	const { userId } = auth.current;
	const navigate = useNavigate();
	const initialState = {
		recipeImage: null,
		recipeName: "",
		recipeCategoryName: "",
		recipeMealName: "",
		recipeDescription: "",
		recipeIngredients: ["", "", ""],
		recipeInstructions: ["", "", ""],
		recipePrepTime: {
			number: 0,
			unit: "seconds",
		},
		recipeCookTime: {
			number: 0,
			unit: "seconds",
		},
		userId: userId,
	};
	const [formRecipe, setFormRecipe] = useState(initialState);
	const [preview, setPreview] = useState(null);
	const [disabled, setDisabled] = useState(true);

	const calculateTotalTime = (timeField1, timeField2) => {
		const unitsInSeconds = {
			days: 24 * 60 * 60,
			hours: 60 * 60,
			minutes: 60,
			seconds: 1,
		};

		const totalSeconds =
			timeField1.number * unitsInSeconds[timeField1.unit] +
			timeField2.number * unitsInSeconds[timeField2.unit];

		const totalTime = {
			days: Math.floor(totalSeconds / unitsInSeconds.days),
			hours: Math.floor(
				(totalSeconds % unitsInSeconds.days) / unitsInSeconds.hours
			),
			minutes: Math.floor(
				(totalSeconds % unitsInSeconds.hours) / unitsInSeconds.minutes
			),
			seconds: Math.floor(totalSeconds % unitsInSeconds.minutes),
		};

		return totalTime;
	};

	const handleFileChange = (event) => {
		setDisabled(false);
		const file = event.target.files[0];
		setFormRecipe({ ...formRecipe, recipeImage: file });
		if (file) {
			const reader = new FileReader();

			reader.onload = () => {
				setPreview(reader.result);
			};

			reader.readAsDataURL(file);
			console.log(preview);
		}
	};
	const handleInputChange = (event) => {
		setDisabled(false);
		const { name, value } = event.target;
		setFormRecipe({
			...formRecipe,
			[name]: value,
		});
	};
	const handleArrayChange = (event, index) => {
		setDisabled(false);
		const { name, value } = event.target;
		const updatedFormRecipe = { ...formRecipe };
		updatedFormRecipe[name][index] = value;
		setFormRecipe(updatedFormRecipe);
	};
	const handleDeleteField = (event, index) => {
		const { name } = event.target;
		setFormRecipe({
			...formRecipe,
			[name]: [...formRecipe[name].filter((_, i) => i !== index)],
		});
	};
	const handleAddField = (event) => {
		const { name } = event.target;
		setFormRecipe({
			...formRecipe,
			[name]: [...formRecipe[name], ""],
		});
		console.log(formRecipe);
	};
	const handleTimeNumberChange = (event) => {
		setDisabled(false);
		const { name, value } = event.target;
		setFormRecipe((prevFormRecipe) => ({
			...prevFormRecipe,
			[name]: {
				...prevFormRecipe[name],
				number: value,
			},
		}));
	};

	const handleSelectChange = (event) => {
		setDisabled(false);
		const { name, value } = event.target;
		setFormRecipe((prevFormRecipe) => ({
			...prevFormRecipe,
			[name]: {
				...prevFormRecipe[name],
				unit: value,
			},
		}));
	};

	const handleReset = () => {
		setFormRecipe(initialState);
		setDisabled(true);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (formRecipe.recipeImage) {
			try {
				const response = await axios.post("/recipe/add", formRecipe, {
					headers: {
						"Content-Type": "multipart/form-data",
					},
				});

				if (response.status === 200) {
					console.log("File uploaded successfully");
					navigate("/");
				} else {
					console.error("Failed to upload file");
				}
			} catch (error) {
				console.error("Error uploading file:", error);
			}
		}
	};
	useEffect(() => console.log(formRecipe));
	return (
		<div className="add">
			<div className="blur">
				<div className="add__container">
					<div className="add__container__header">
						<h1 className="add__container__header__title">
							Create a new recipe
						</h1>
						<p className="add__container__header__declaration">
							Uploading personal recipes is easy! Add yours to
							your favorites, share with friends, family, or the
							community.
						</p>
					</div>
					<div className="add__container__form">
						<Form
							onSubmit={handleSubmit}
							encType="multipart/form-data"
							method="POST"
						>
							<Row className="add__container__form__field">
								<Col md={6}>
									<Form.Group
										controlId="formRecipeName"
										className="add__container__form__field"
									>
										<Form.Label>Recipe Name</Form.Label>
										<Form.Control
											type="text"
											name="recipeName"
											value={formRecipe.recipeName}
											onChange={handleInputChange}
										/>
									</Form.Group>
									<Form.Group
										controlId="formRecipeDescription"
										className="add__container__form__field"
										style={{ height: "fit-content" }}
									>
										<Form.Label>Description</Form.Label>
										<Form.Control
											as="textarea"
											rows={5}
											name="recipeDescription"
											value={formRecipe.recipeDescription}
											onChange={handleInputChange}
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group
										controlId="formRecipeImage"
										className="add__container__form__imgContainer"
									>
										<Form.Label>Image</Form.Label>
										{preview ? (
											<img
												src={preview}
												alt="This is a preview"
												className="add__container__form__imgContainer__img"
											/>
										) : (
											<img
												src={require("../assets/images/cameraPreview.png")}
												alt="Camera preview"
												className="add__container__form__imgContainer__img"
											/>
										)}
										<Form.Control
											type="file"
											name="recipeImage"
											accept="image/*"
											onChange={handleFileChange}
											style={{ marginTop: "10px" }}
										/>
									</Form.Group>
								</Col>
							</Row>
							<Row className="add__container__form__field">
								<Col md={6}>
									<Form.Group
										controlId="formRecipeCategoryName"
										className="add__container__form__field"
									>
										<Form.Label>Category</Form.Label>
										<Form.Control
											type="text"
											name="recipeCategoryName"
											value={
												formRecipe.recipeCategoryName
											}
											onChange={handleInputChange}
										/>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group
										controlId="formRecipeMealName"
										className="add__container__form__field"
									>
										<Form.Label>Meal</Form.Label>
										<Form.Control
											type="text"
											name="recipeMealName"
											value={formRecipe.recipeMealName}
											onChange={handleInputChange}
										/>
									</Form.Group>
								</Col>
							</Row>

							<Form.Group
								controlId="formRecipePrepTime"
								className="add__container__form__time"
							>
								<Form.Label>Preparation Time</Form.Label>
								<Form.Control
									type="number"
									name="recipePrepTime"
									value={formRecipe.recipePrepTime.number}
									onChange={handleTimeNumberChange}
									className="add__container__form__time__input"
								/>
								<Form.Select
									value={formRecipe.recipePrepTime.time}
									name="recipePrepTime"
									className="add__container__form__time__select"
									onChange={handleSelectChange}
								>
									<option value="seconds">seconds</option>
									<option value="minutes">minutes</option>
									<option value="hours">hours</option>
									<option value="days">days</option>
								</Form.Select>
							</Form.Group>
							<Form.Group
								controlId="formRecipeCookTime"
								className="add__container__form__time"
							>
								<Form.Label>Cooking Time</Form.Label>
								<Form.Control
									type="number"
									name="recipeCookTime"
									value={formRecipe.recipeCookTime.number}
									onChange={handleTimeNumberChange}
									className="add__container__form__time__input"
								/>
								<Form.Select
									value={formRecipe.recipeCookTime.time}
									name="recipeCookTime"
									className="add__container__form__time__select"
									onChange={handleSelectChange}
								>
									<option value="seconds">seconds</option>
									<option value="minutes">minutes</option>
									<option value="hours">hours</option>
									<option value="days">days</option>
								</Form.Select>
							</Form.Group>

							<div>
								<strong>Total time</strong>
								<p>
									{convertTime(
										calculateTotalTime(
											formRecipe.recipePrepTime,
											formRecipe.recipeCookTime
										)
									)}
								</p>
							</div>
							<Form.Group
								controlId="formRecipeIngredients"
								className="add__container__form__field"
							>
								<Form.Label>Ingredients</Form.Label>
								{formRecipe.recipeIngredients.map(
									(ingredient, index) => (
										<div
											key={index}
											className="d-flex gap-2 mb-3"
										>
											<span>{index + 1}.</span>
											<Form.Control
												type="text"
												name={`recipeIngredients`}
												value={ingredient}
												onChange={(event) =>
													handleArrayChange(
														event,
														index
													)
												}
											/>

											<button
												name="recipeIngredients"
												className="btn btn-danger"
												type="button"
												disabled={
													formRecipe.recipeIngredients
														.length <= 3
												}
												onClick={(event) =>
													handleDeleteField(
														event,
														index
													)
												}
											>
												X
											</button>
										</div>
									)
								)}
								<button
									name="recipeIngredients"
									className="add__container__form__field__button"
									type="button"
									onClick={handleAddField}
								>
									+ Add ingredient
								</button>
							</Form.Group>
							<Form.Group
								controlId="formRecipeInstructions"
								className="add__container__form__field"
							>
								<Form.Label>Instructions</Form.Label>
								{formRecipe.recipeInstructions.map(
									(instruction, index) => (
										<div
											key={index}
											className="d-flex gap-2 mb-3"
										>
											<span>{index + 1}. </span>
											<Form.Control
												type="text"
												name={`recipeInstructions`}
												value={instruction}
												onChange={(event) =>
													handleArrayChange(
														event,
														index
													)
												}
											/>

											<button
												name="recipeInstructions"
												className="btn btn-danger"
												type="button"
												disabled={
													formRecipe
														.recipeInstructions
														.length <= 3
												}
												onClick={(event) =>
													handleDeleteField(
														event,
														index
													)
												}
											>
												X
											</button>
										</div>
									)
								)}
								<button
									name="recipeInstructions"
									className="add__container__form__field__button"
									type="button"
									onClick={handleAddField}
								>
									+ Add instruction
								</button>
							</Form.Group>

							<div style={{ textAlign: "right" }}>
								<Button
									type="reset"
									className="add__container__form__reset btn btn-light"
									onClick={handleReset}
								>
									Reset
								</Button>
								<Button
									type="submit"
									className="add__container__form__submit"
									disabled={disabled}
								>
									Save Changes
								</Button>
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AddRecipe;
