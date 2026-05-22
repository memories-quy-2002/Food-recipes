import cameraPreview from "../assets/images/cameraPreview.png";
import React, { useContext, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import axios from "../api/axios";
import {
	isSupabaseStorageConfigured,
	uploadRecipeImage,
} from "../api/supabaseStorage";
import PageHelmet from "../components/seo/PageHelmet";
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
			number: 15,
			unit: "minutes",
		},
		recipeCookTime: {
			number: 30,
			unit: "minutes",
		},
		userId: userId,
	};
	const [formRecipe, setFormRecipe] = useState(initialState);
	const [preview, setPreview] = useState(null);
	const [disabled, setDisabled] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [uploadStatus, setUploadStatus] = useState("idle");
	const storageConfigured = isSupabaseStorageConfigured();

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

	const parsePastedList = (value) =>
		value
			.split(/\r?\n/)
			.map((item) =>
				item
					.trim()
					.replace(/^([•*+-]|\d+[.)])\s+/, "")
					.trim()
			)
			.filter(Boolean);

	const handleFileChange = (event) => {
		setDisabled(false);
		setSubmitError("");
		const file = event.target.files[0];
		setFormRecipe({ ...formRecipe, recipeImage: file });
		if (file) {
			const reader = new FileReader();

			reader.onload = () => {
				setPreview(reader.result);
			};

			reader.readAsDataURL(file);
		}
	};
	const handleInputChange = (event) => {
		setDisabled(false);
		setSubmitError("");
		const { name, value } = event.target;
		setFormRecipe({
			...formRecipe,
			[name]: value,
		});
	};
	const handleArrayChange = (event, index) => {
		setDisabled(false);
		setSubmitError("");
		const { name, value } = event.target;
		const updatedFormRecipe = { ...formRecipe };
		updatedFormRecipe[name][index] = value;
		setFormRecipe(updatedFormRecipe);
	};
	const handleArrayPaste = (event, index) => {
		const { name } = event.target;
		const pastedText = event.clipboardData.getData("text");
		const pastedItems = parsePastedList(pastedText);

		if (pastedItems.length <= 1) return;

		event.preventDefault();
		setDisabled(false);
		setSubmitError("");
		setFormRecipe((currentRecipe) => {
			const currentItems = [...currentRecipe[name]];
			currentItems.splice(index, 1, ...pastedItems);
			return {
				...currentRecipe,
				[name]: currentItems,
			};
		});
	};
	const handleDeleteField = (event, index) => {
		setDisabled(false);
		setSubmitError("");
		const { name } = event.target;
		setFormRecipe({
			...formRecipe,
			[name]: [...formRecipe[name].filter((_, i) => i !== index)],
		});
	};
	const handleAddField = (event) => {
		setDisabled(false);
		setSubmitError("");
		const { name } = event.target;
		setFormRecipe({
			...formRecipe,
			[name]: [...formRecipe[name], ""],
		});
	};
	const handleTimeNumberChange = (event) => {
		setDisabled(false);
		setSubmitError("");
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
		setSubmitError("");
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
		setPreview(null);
		setDisabled(true);
		setSubmitError("");
		setUploadStatus("idle");
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!formRecipe.recipeImage) {
			setSubmitError("Please choose a recipe image before publishing.");
			return;
		}

		const cleanedRecipe = {
			...formRecipe,
			recipeName: formRecipe.recipeName.trim(),
			recipeCategoryName: formRecipe.recipeCategoryName.trim(),
			recipeMealName: formRecipe.recipeMealName.trim(),
			recipeDescription: formRecipe.recipeDescription.trim(),
			recipeIngredients: formRecipe.recipeIngredients
				.map((ingredient) => ingredient.trim())
				.filter(Boolean),
			recipeInstructions: formRecipe.recipeInstructions
				.map((instruction) => instruction.trim())
				.filter(Boolean),
			userId,
		};

		if (
			!cleanedRecipe.recipeName ||
			!cleanedRecipe.recipeCategoryName ||
			!cleanedRecipe.recipeMealName ||
			!cleanedRecipe.recipeDescription
		) {
			setSubmitError("Please fill in the recipe name, description, category, and meal.");
			return;
		}

		if (
			cleanedRecipe.recipeIngredients.length < 3 ||
			cleanedRecipe.recipeInstructions.length < 3
		) {
			setSubmitError("Please add at least 3 ingredients and 3 instructions.");
			return;
		}

		try {
			setIsSubmitting(true);
			setSubmitError("");
			setUploadStatus("uploading");
			const imageUpload = await uploadRecipeImage({
				file: formRecipe.recipeImage,
				recipeName: cleanedRecipe.recipeName,
				userId,
			});
			setUploadStatus("saving");

			const response = await axios.post(
				"/recipe/add",
				{
					...cleanedRecipe,
					recipeImage: undefined,
					imageUrl: imageUpload.url,
					imagePath: imageUpload.path,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (response.status === 200) {
				navigate("/food");
			}
		} catch (error) {
			console.error("Error publishing recipe:", error);
			setSubmitError(
				error.response?.data?.message ||
					error.message ||
					"Unable to publish this recipe. Please try again."
			);
			setUploadStatus("idle");
		} finally {
			setIsSubmitting(false);
		}
	};
	return (
		<div className="add">
			<PageHelmet
				title="Add Recipe"
				description="Create and share a new recipe with ingredients, cooking steps, images, and preparation time."
				path="/food/add"
				noIndex
			/>
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
						{!storageConfigured && (
							<div className="add__container__notice add__container__notice--warning">
								<strong>Supabase Storage setup needed</strong>
								<p>
									Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
									and VITE_SUPABASE_RECIPE_BUCKET before
									publishing image uploads.
								</p>
							</div>
						)}
						{submitError && (
							<div className="add__container__notice add__container__notice--error">
								<strong>Recipe was not published</strong>
								<p>{submitError}</p>
							</div>
						)}
						{uploadStatus !== "idle" && (
							<div className="add__container__steps" aria-live="polite">
								<span
									className={
										uploadStatus === "uploading" ||
										uploadStatus === "saving"
											? "add__container__steps__item add__container__steps__item--active"
											: "add__container__steps__item"
									}
								>
									Upload image
								</span>
								<span
									className={
										uploadStatus === "saving"
											? "add__container__steps__item add__container__steps__item--active"
											: "add__container__steps__item"
									}
								>
									Save recipe
								</span>
							</div>
						)}
						<Form
							onSubmit={handleSubmit}
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
											required
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
											required
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
												src={cameraPreview}
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
											required
										/>
										<p className="add__container__form__hint">
											Images upload directly to Supabase
											Storage, then the recipe saves the
											public image URL.
										</p>
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
											required
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
											required
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
									min="1"
								/>
								<Form.Select
									value={formRecipe.recipePrepTime.unit}
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
									min="1"
								/>
								<Form.Select
									value={formRecipe.recipeCookTime.unit}
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
												onPaste={(event) =>
													handleArrayPaste(
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
												onPaste={(event) =>
													handleArrayPaste(
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
									disabled={disabled || isSubmitting}
								>
									{isSubmitting ? "Publishing..." : "Publish recipe"}
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
