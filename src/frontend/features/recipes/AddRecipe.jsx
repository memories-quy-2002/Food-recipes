import cameraPreview from "@/shared/assets/images/cameraPreview.png";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { serializeCreateRecipeDraftPayload } from "@/shared/api/mutations";
import { getArrayPayload } from "@/shared/api/payload";
import {
	isSupabaseStorageConfigured,
	uploadRecipeImage,
} from "@/shared/api/supabaseStorage";
import PageHelmet from "@/shared/seo/PageHelmet";
import "./AddRecipe.scss";
import convertTime from "@/shared/utils/convertTime";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import { useToast } from "@/app/ToastProvider";
import { useNavigate } from "react-router-dom";
import {
	clearRecipeDraft,
	loadRecipeDraft,
	saveRecipeDraft,
} from "./recipeDraftStorage";
import { createRecipeFormSchema } from "./recipeForm.schema";

const DIETARY_OPTIONS = ["vegetarian", "vegan", "gluten-free", "dairy-free", "low-carb"];
const ALLERGEN_OPTIONS = ["wheat", "peanuts", "tree nuts", "milk", "eggs", "soy", "fish", "shellfish"];
const NUTRITION_FIELDS = ["servings", "calories", "protein", "carbohydrates", "fat", "fiber", "sugar", "sodium"];

const createInitialRecipeState = (userId) => ({
	recipeImage: null,
	recipeName: "",
	recipeCategoryName: "",
	recipeMealName: "",
	recipeDescription: "",
	recipeIngredients: [""],
	recipeInstructions: [""],
	recipePrepTime: { number: 15, unit: "minutes" },
	recipeCookTime: { number: 30, unit: "minutes" },
	structuredIngredients: [{ quantityText: "", unit: "", name: "", preparation: "" }],
	nutrition: {
		servings: "",
		calories: "",
		protein: "",
		carbohydrates: "",
		fat: "",
		fiber: "",
		sugar: "",
		sodium: "",
	},
	dietaryTags: [],
	allergenTags: [],
	serverRecipeId: null,
});

const hasDraftContent = (recipe) =>
	[
		recipe.recipeName,
		recipe.recipeCategoryName,
		recipe.recipeMealName,
		recipe.recipeDescription,
		...(recipe.recipeIngredients || []),
		...(recipe.recipeInstructions || []),
		...(recipe.structuredIngredients || []).flatMap((ingredient) => [ingredient.quantityText, ingredient.unit, ingredient.name, ingredient.preparation]),
		...(recipe.dietaryTags || []),
		...(recipe.allergenTags || []),
		...(NUTRITION_FIELDS || []).map((field) => recipe.nutrition?.[field]),
	].some((value) => String(value || "").trim()) ||
	String(recipe.recipePrepTime?.number) !== "15" ||
	String(recipe.recipePrepTime?.unit) !== "minutes" ||
	String(recipe.recipeCookTime?.number) !== "30" ||
	String(recipe.recipeCookTime?.unit) !== "minutes";

export const validateRecipeForm = (
	recipe,
	{ categories = [], meals = [], isPublishing = true } = {}
) => {
	const normalizedRecipe = {
		recipeName: "",
		recipeCategoryName: "",
		recipeMealName: "",
		recipeDescription: "",
		recipeIngredients: [],
		recipeInstructions: [],
		recipePrepTime: { number: "", unit: "minutes" },
		recipeCookTime: { number: "", unit: "minutes" },
		recipeImage: null,
		structuredIngredients: [],
		nutrition: {},
		dietaryTags: [],
		allergenTags: [],
		serverRecipeId: null,
		...recipe,
	};
	const result = createRecipeFormSchema({ categories, meals, isPublishing }).safeParse(normalizedRecipe);
	const errors = result.success ? [] : result.error.issues.map(({ message }) => message);
	const errorOrder = ["Recipe name is required.", "Choose a supported category.", "Choose a supported meal.", "Add at least one ingredient.", "Add at least one instruction.", "Preparation time must be a positive number.", "Cooking time must be a positive number."];
	return {
		errors: errors.sort((left, right) => errorOrder.indexOf(left) - errorOrder.indexOf(right)),
	};
};

const getServerRecipeId = (response) => response?.data?.recipe?.recipe_id ?? response?.data?.recipe?.id ?? response?.data?.recipe_id ?? response?.data?.id;

const normalizeStructuredIngredients = (ingredients, legacyIngredients = []) => {
	const structured = (Array.isArray(ingredients) ? ingredients : [])
		.map((ingredient, index) => ({
			position: index,
			quantity: ingredient.quantity === "" || ingredient.quantity === undefined ? null : Number(ingredient.quantity),
			quantityText: String(ingredient.quantityText || "").trim() || null,
			unit: String(ingredient.unit || "").trim() || null,
			name: String(ingredient.name || "").trim(),
			preparation: String(ingredient.preparation || "").trim() || null,
			originalText: String(ingredient.originalText || "").trim() || null,
		}))
		.filter((ingredient) => ingredient.name);
	if (structured.length) return structured;
	return (Array.isArray(legacyIngredients) ? legacyIngredients : [])
		.map((name, index) => ({ position: index, quantity: null, quantityText: null, unit: null, name: String(name).trim(), preparation: null, originalText: String(name).trim() }))
		.filter((ingredient) => ingredient.name);
};

const normalizeNutritionPayload = (nutrition = {}) => Object.fromEntries(
	NUTRITION_FIELDS
		.map((field) => [field, nutrition[field] === "" || nutrition[field] === undefined ? null : Number(nutrition[field])])
		.filter(([, value]) => value !== null && Number.isFinite(value) || value === null)
);

const normalizeAllergenTag = (tag) => String(tag || "").trim().toLowerCase() === "tree nuts" ? "tree_nuts" : String(tag || "").trim().toLowerCase();

const AddRecipe = () => {
	const { auth } = useContext(AuthContext);
	const { userId } = auth.current;
	const { refreshRecipes } = useContext(RecipeContext);
	const { showToast } = useToast();
	const navigate = useNavigate();
	const [preview, setPreview] = useState(null);
	const [disabled, setDisabled] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [uploadStatus, setUploadStatus] = useState("idle");
	const [categories, setCategories] = useState([]);
	const [meals, setMeals] = useState([]);
	const [listError, setListError] = useState("");
	const [restoreCandidate, setRestoreCandidate] = useState(null);
	const [isDraftHydrated, setIsDraftHydrated] = useState(false);
	const [hydratedUserId, setHydratedUserId] = useState(null);
	const [draftStatus, setDraftStatus] = useState("idle");
	const storageConfigured = isSupabaseStorageConfigured();
	const recipeSchema = useMemo(
		() => createRecipeFormSchema({ categories, meals, isPublishing: true }),
		[categories, meals]
	);
	const {
		register,
		handleSubmit: handleRecipeSubmit,
		reset,
		setValue,
		watch,
		getValues,
		formState: { errors: formErrors },
	} = useForm({
		resolver: zodResolver(recipeSchema),
		defaultValues: createInitialRecipeState(userId),
	});
	const formRecipe = watch();
	const draftFingerprint = JSON.stringify(formRecipe);
	const currentRestoreCandidate =
		restoreCandidate?.userId === String(userId) ? restoreCandidate : null;

	useEffect(() => {
		setRestoreCandidate(null);
		setIsDraftHydrated(false);
		setHydratedUserId(null);
		reset(createInitialRecipeState(userId));
		setPreview(null);

		const savedDraft = loadRecipeDraft(window.localStorage, userId);
		if (savedDraft) {
			setRestoreCandidate(savedDraft);
			setHydratedUserId(userId);
			return;
		}
		setIsDraftHydrated(true);
		setHydratedUserId(userId);
	}, [reset, userId]);

	useEffect(() => {
		if (
			!isDraftHydrated ||
			hydratedUserId !== userId ||
			currentRestoreCandidate ||
			!hasDraftContent(formRecipe)
		)
			return undefined;

		setDraftStatus("saving");
		const timeoutId = window.setTimeout(() => {
			setDraftStatus(
				saveRecipeDraft(window.localStorage, userId, formRecipe) ? "saved" : "error"
			);
		}, 500);

		return () => window.clearTimeout(timeoutId);
	}, [currentRestoreCandidate, draftFingerprint, hydratedUserId, isDraftHydrated, userId]);

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
					.replace(/^([\u2022*+-]|\d+[.)])\s+/, "")
					.trim()
			)
			.filter(Boolean);

	const handleFileChange = (event) => {
		setDisabled(false);
		setSubmitError("");
		const file = event.target.files[0];
		setValue("recipeImage", file || null, { shouldDirty: true });
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
		setValue(name, value, { shouldDirty: true });
	};
	const handleArrayChange = (field, index, value) => {
		setDisabled(false);
		setSubmitError("");
		setValue(`${field}.${index}`, value, { shouldDirty: true });
	};
	const handleArrayPaste = (field, event, index) => {
		const pastedText = event.clipboardData.getData("text");
		const pastedItems = parsePastedList(pastedText);

		if (pastedItems.length <= 1) return;

		event.preventDefault();
		setDisabled(false);
		setSubmitError("");
		const currentItems = [...getValues(field)];
		currentItems.splice(index, 1, ...pastedItems);
		setValue(field, currentItems, { shouldDirty: true });
	};
	const handleDeleteField = (event, index) => {
		setDisabled(false);
		setSubmitError("");
		const { name } = event.target;
		setValue(name, getValues(name).filter((_, i) => i !== index), { shouldDirty: true });
	};
	const handleAddField = (event) => {
		setDisabled(false);
		setSubmitError("");
		const { name } = event.target;
		setValue(name, [...getValues(name), ""], { shouldDirty: true });
	};
	const handleStructuredChange = (index, field, value) => {
		setDisabled(false);
		setSubmitError("");
		setValue(`structuredIngredients.${index}.${field}`, value, { shouldDirty: true });
	};
	const handleAddStructuredIngredient = () => {
		setDisabled(false);
		setSubmitError("");
		setValue("structuredIngredients", [
			...getValues("structuredIngredients"),
			{ quantityText: "", unit: "", name: "", preparation: "" },
		], { shouldDirty: true });
	};
	const handleDeleteStructuredIngredient = (index) => {
		setDisabled(false);
		setSubmitError("");
		const remaining = getValues("structuredIngredients").filter((_, itemIndex) => itemIndex !== index);
		setValue("structuredIngredients", remaining.length ? remaining : [{ quantityText: "", unit: "", name: "", preparation: "" }], { shouldDirty: true });
	};
	const handleToggleTag = (field, tag) => {
		const selected = getValues(field) || [];
		setValue(field, selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag], { shouldDirty: true });
		setDisabled(false);
		setSubmitError("");
	};
	const handleTimeNumberChange = (event) => {
		setDisabled(false);
		setSubmitError("");
		const { name, value } = event.target;
		setValue(name, value, { shouldDirty: true });
	};

	const handleSelectChange = (event) => {
		setDisabled(false);
		setSubmitError("");
		const { name, value } = event.target;
		setValue(name, value, { shouldDirty: true });
	};

	const handleCategoryOptionChange = (event) => {
		const { value } = event.target;
		setDisabled(false);
		setSubmitError("");
		setValue("recipeCategoryName", value, { shouldDirty: true });
	};

	const handleMealOptionChange = (event) => {
		const { value } = event.target;
		setDisabled(false);
		setSubmitError("");
		setValue("recipeMealName", value, { shouldDirty: true });
	};

	const handleReset = () => {
		clearRecipeDraft(window.localStorage, userId);
		reset(createInitialRecipeState(userId));
		setPreview(null);
		setDisabled(true);
		setSubmitError("");
		setUploadStatus("idle");
		setRestoreCandidate(null);
		setIsDraftHydrated(true);
		setDraftStatus("idle");
	};

	const handleRestoreDraft = () => {
		if (!currentRestoreCandidate) return;
		reset({
			...createInitialRecipeState(userId),
			...currentRestoreCandidate.form,
			recipeImage: null,
		});
		setDisabled(false);
		setRestoreCandidate(null);
		setIsDraftHydrated(true);
		setDraftStatus("saved");
	};

	const handleStartFresh = () => {
		clearRecipeDraft(window.localStorage, userId);
		setRestoreCandidate(null);
		reset(createInitialRecipeState(userId));
		setIsDraftHydrated(true);
		setDraftStatus("idle");
	};

	const saveDraftLocally = (recipe) => {
		const saved = saveRecipeDraft(window.localStorage, userId, recipe);
		setDraftStatus(saved ? "saved" : "error");
		return saved;
	};

	const saveDraftToServer = async (recipe, imageUrl) => {
		const recipePayload = serializeCreateRecipeDraftPayload({
			recipe,
			categories,
			meals,
			imageUrl,
		});
		const existingId = recipe.serverRecipeId;
		const response = existingId
			? await axios.patch(apiRoutes.recipe(existingId), recipePayload)
			: await axios.post(apiRoutes.userRecipeDrafts, recipePayload, { headers: { "Content-Type": "application/json" } });
		const recipeId = existingId || getServerRecipeId(response);
		if (!recipeId) throw new Error("The server did not return a draft recipe ID.");
		await axios.put(apiRoutes.recipeIngredients(recipeId), { ingredients: normalizeStructuredIngredients(recipe.structuredIngredients, recipe.recipeIngredients) });
		await axios.put(apiRoutes.recipeNutrition(recipeId), normalizeNutritionPayload(recipe.nutrition));
		await axios.put(apiRoutes.recipeDietaryTags(recipeId), { dietaryTags: recipe.dietaryTags || [], allergenTags: (recipe.allergenTags || []).map(normalizeAllergenTag) });
		return recipeId;
	};

	const handleSaveDraft = async () => {
		const recipe = getValues();
		const savedLocally = saveDraftLocally(recipe);
		try {
			setSubmitError("");
			const recipeId = await saveDraftToServer(recipe);
			setValue("serverRecipeId", recipeId, { shouldDirty: false });
			saveDraftLocally({ ...recipe, serverRecipeId: recipeId });
			showToast({ title: "Draft saved" });
		} catch (error) {
			console.error("Unable to save server draft:", error);
			if (savedLocally) {
				showToast({ title: "Draft saved locally", message: "The server draft could not be updated yet.", type: "error" });
			} else {
				setSubmitError(error.response?.data?.message || error.message || "Unable to save this draft.");
			}
		}
	};

	useEffect(() => {
		const fetchLists = async () => {
			try {
				setListError("");
				const [categoriesResponse, mealsResponse] = await Promise.all([
					axios.get(apiRoutes.categories),
					axios.get(apiRoutes.meals),
				]);

				setCategories(getArrayPayload(categoriesResponse.data, "categories"));
				setMeals(getArrayPayload(mealsResponse.data, "meals"));
			} catch (error) {
				console.error(error);
				setListError(
					error.response?.data?.message ||
						"Unable to load the current category and meal lists."
				);
			}
		};

		fetchLists();
	}, []);

	const handleInvalidSubmit = (invalidFields) => {
		const messages = Object.values(invalidFields)
			.flatMap((field) => {
				if (field?.message) return [field.message];
				return Object.values(field || {}).flatMap((nestedField) =>
					nestedField?.message ? [nestedField.message] : []
				);
			})
			.filter(Boolean);
		setSubmitError(messages.join(" ") || "Please review the recipe form.");
	};

	const handleSubmit = async (values) => {
		const cleanedRecipe = {
			...values,
			recipeName: values.recipeName.trim(),
			recipeCategoryName: values.recipeCategoryName.trim(),
			recipeMealName: values.recipeMealName.trim(),
			recipeDescription: values.recipeDescription.trim(),
			recipeIngredients: values.recipeIngredients
				.map((ingredient) => ingredient.trim())
				.filter(Boolean),
			recipeInstructions: values.recipeInstructions
				.map((instruction) => instruction.trim())
				.filter(Boolean),
			userId,
		};

		try {
			setIsSubmitting(true);
			setSubmitError("");
			setUploadStatus("uploading");

			const imageUpload = await uploadRecipeImage({
				file: values.recipeImage,
				recipeName: cleanedRecipe.recipeName,
			});
			setUploadStatus("saving");

			const recipeId = await saveDraftToServer(cleanedRecipe, imageUpload.url);
			setValue("serverRecipeId", recipeId, { shouldDirty: false });
			const response = await axios.post(apiRoutes.recipePublish(recipeId));

			if (response.status >= 200 && response.status < 300) {
				clearRecipeDraft(window.localStorage, userId);
				// Keep the existing compatibility boundary; the provider now invalidates the query cache.
				await refreshRecipes().catch((refreshError) =>
					console.error("Unable to refresh recipes after publish:", refreshError)
				);
				showToast({ title: "Recipe published successfully" });
				navigate("/food");
			}
		} catch (error) {
			console.error("Error publishing recipe:", error);
			const message =
				error.response?.data?.message ||
				error.message ||
				"Unable to publish this recipe. Please try again.";
			setSubmitError(message);
			showToast({
				title: "Couldn’t publish recipe",
				message,
				type: "error",
			});
			setUploadStatus("idle");
		} finally {
			setIsSubmitting(false);
		}
	};
	return (
		<main className="fr-page fr-add add">
			<PageHelmet
				title="Add Recipe"
				description="Create and share a new recipe with ingredients, cooking steps, images, and preparation time."
				path="/food/add"
				noIndex
			/>
			<div className="add__surface">
				<div className="add__container">
					<div className="add__container__header">
						<div className="add__container__header__meta" aria-label="Recipe status">
							<span className="add__container__header__status">Draft</span>
							<span className="add__container__header__autosave" aria-live="polite">
								{draftStatus === "saving"
									? "Saving draft…"
									: draftStatus === "saved"
										? "Saved just now"
										: draftStatus === "error"
											? "Draft could not be saved locally"
											: "Local draft only"}
							</span>
						</div>
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
						{currentRestoreCandidate && (
							<div className="add__container__notice add__container__notice--restore" role="status">
								<strong>Restore your saved draft?</strong>
								<p>This draft is stored only in this browser for your account. Your current form will stay unchanged until you choose.</p>
								<div className="add__container__notice__actions">
									<Button type="button" onClick={handleRestoreDraft}>Restore draft</Button>
									<Button type="button" variant="light" onClick={handleStartFresh}>Start fresh</Button>
								</div>
							</div>
						)}
						{!storageConfigured && (
							<div className="add__container__notice add__container__notice--error">
								<strong>Supabase Storage setup needed</strong>
								<p>
									Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
									and VITE_SUPABASE_RECIPE_BUCKET before
									publishing image uploads.
								</p>
							</div>
						)}
						{submitError && (
							<div
								className="add__container__notice add__container__notice--error"
								role="alert"
							>
								<strong>Recipe was not published</strong>
								<p>{submitError}</p>
							</div>
						)}
						{listError && (
							<div className="add__container__notice add__container__notice--warning">
								<strong>Lists could not load</strong>
								<p>
									{listError} Publishing requires a category and meal from
									the supported lists.
								</p>
							</div>
						)}
						{uploadStatus !== "idle" && (
							<div className="add__container__notice" aria-live="polite">
								<strong>
									{uploadStatus === "uploading"
										? "Uploading image"
										: "Saving recipe"}
								</strong>
								<p>
									{uploadStatus === "uploading"
										? "Sending the recipe image to Supabase Storage."
										: "Saving the recipe with the uploaded image URL."}
								</p>
							</div>
						)}
						<Form onSubmit={handleRecipeSubmit(handleSubmit, handleInvalidSubmit)}>
							<Row className="add__container__form__field">
								<Col md={6}>
									<Form.Group
										controlId="formRecipeName"
										className="add__container__form__field"
									>
										<Form.Label>Recipe Name</Form.Label>
										<Form.Control
											type="text"
											{...register("recipeName", { onChange: handleInputChange })}
											value={formRecipe.recipeName}
											aria-invalid={Boolean(formErrors.recipeName)}
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
											{...register("recipeDescription", { onChange: handleInputChange })}
											value={formRecipe.recipeDescription}
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
												width="800"
												height="600"
												className="add__container__form__imgContainer__img"
											/>
										) : (
											<img
												src={cameraPreview}
												alt="Camera preview"
												width="800"
												height="600"
												className="add__container__form__imgContainer__img"
											/>
										)}
										<Form.Control
											type="file"
											{...register("recipeImage")}
											accept="image/*"
											onChange={handleFileChange}
											style={{ marginTop: "10px" }}
										/>
										<p className="add__container__form__hint">
											Optional for drafts. Publishing uploads the image to
											Supabase Storage and stores its public URL.
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
										<Form.Select
											{...register("recipeCategoryName", { onChange: handleCategoryOptionChange })}
											value={formRecipe.recipeCategoryName}
											aria-invalid={Boolean(formErrors.recipeCategoryName)}
											required
										>
											<option value="" disabled>
												Choose a category
											</option>
											{categories.map(({ id, name }) => (
												<option key={id} value={name}>
													{name}
												</option>
											))}
											</Form.Select>
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group
										controlId="formRecipeMealName"
										className="add__container__form__field"
									>
										<Form.Label>Meal</Form.Label>
										<Form.Select
											{...register("recipeMealName", { onChange: handleMealOptionChange })}
											value={formRecipe.recipeMealName}
											aria-invalid={Boolean(formErrors.recipeMealName)}
											required
										>
											<option value="" disabled>
												Choose a meal
											</option>
											{meals.map(({ id, name }) => (
												<option key={id} value={name}>
													{name}
												</option>
											))}
											</Form.Select>
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
									{...register("recipePrepTime.number", { onChange: handleTimeNumberChange })}
									value={formRecipe.recipePrepTime.number}
									className="add__container__form__time__input"
									min="1"
									step="any"
								/>
								<Form.Select
									value={formRecipe.recipePrepTime.unit}
									{...register("recipePrepTime.unit", { onChange: handleSelectChange })}
									className="add__container__form__time__select"
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
									{...register("recipeCookTime.number", { onChange: handleTimeNumberChange })}
									value={formRecipe.recipeCookTime.number}
									className="add__container__form__time__input"
									min="1"
									step="any"
								/>
								<Form.Select
									value={formRecipe.recipeCookTime.unit}
									{...register("recipeCookTime.unit", { onChange: handleSelectChange })}
									className="add__container__form__time__select"
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
								<Form.Label>Structured ingredients</Form.Label>
								<p className="add__container__form__hint">Add quantities and units when known. Nutrition is entered manually below.</p>
								{(formRecipe.structuredIngredients || []).map((ingredient, index) => (
									<div key={index} className="d-flex gap-2 mb-3 flex-wrap">
										<span aria-hidden="true">{index + 1}.</span>
										<Form.Control aria-label={`Ingredient ${index + 1} quantity`} placeholder="Qty" value={ingredient.quantityText || ""} onChange={(event) => handleStructuredChange(index, "quantityText", event.target.value)} />
										<Form.Control aria-label={`Ingredient ${index + 1} unit`} placeholder="Unit" value={ingredient.unit || ""} onChange={(event) => handleStructuredChange(index, "unit", event.target.value)} />
										<Form.Control aria-label={`Ingredient ${index + 1} name`} placeholder="Ingredient name" value={ingredient.name || ""} onChange={(event) => handleStructuredChange(index, "name", event.target.value)} />
										<Form.Control aria-label={`Ingredient ${index + 1} preparation`} placeholder="Preparation (optional)" value={ingredient.preparation || ""} onChange={(event) => handleStructuredChange(index, "preparation", event.target.value)} />
										<Button variant="danger" type="button" onClick={() => handleDeleteStructuredIngredient(index)} disabled={(formRecipe.structuredIngredients || []).length <= 1}>Remove</Button>
									</div>
								))}
								<Button variant="light" type="button" onClick={handleAddStructuredIngredient}>+ Add ingredient</Button>
								{formRecipe.recipeIngredients.some((ingredient) => ingredient.trim()) && (
									<p className="add__container__form__hint">A legacy free-text ingredient list was restored and will be preserved.</p>
								)}
								<details className="mt-3">
									<summary>Legacy free-text ingredient notes</summary>
									{formRecipe.recipeIngredients.map((ingredient, index) => (
										<div key={index} className="d-flex gap-2 mb-2">
											<Form.Control aria-label={`Legacy ingredient ${index + 1}`} type="text" {...register(`recipeIngredients.${index}`)} value={ingredient} onChange={(event) => handleArrayChange("recipeIngredients", index, event.target.value)} onPaste={(event) => handleArrayPaste("recipeIngredients", event, index)} />
											<Button variant="danger" type="button" name="recipeIngredients" disabled={formRecipe.recipeIngredients.length <= 1} onClick={(event) => handleDeleteField(event, index)}>Remove</Button>
										</div>
									))}
									<Button variant="light" type="button" name="recipeIngredients" onClick={handleAddField}>+ Add legacy note</Button>
								</details>
							</Form.Group>

							<Form.Group className="add__container__form__field" controlId="formRecipeNutrition">
								<Form.Label>Nutrition per serving</Form.Label>
								<p className="add__container__form__hint">Manual MVP input; values are not calculated or medically verified.</p>
								<Row>
									{NUTRITION_FIELDS.map((field) => (
										<Col xs={6} md={3} key={field}>
											<Form.Label className="text-capitalize">{field}</Form.Label>
											<Form.Control type="number" min="0" step="any" placeholder="Optional" {...register(`nutrition.${field}`, { onChange: handleInputChange })} value={formRecipe.nutrition?.[field] || ""} />
										</Col>
									))}
								</Row>
							</Form.Group>

							<Form.Group className="add__container__form__field" controlId="formRecipeDietary">
								<Form.Label>Dietary preferences</Form.Label>
								<div className="d-flex gap-2 flex-wrap mb-3">
									{DIETARY_OPTIONS.map((tag) => <Button key={tag} type="button" variant={(formRecipe.dietaryTags || []).includes(tag) ? "primary" : "light"} aria-pressed={(formRecipe.dietaryTags || []).includes(tag)} onClick={() => handleToggleTag("dietaryTags", tag)}>{tag}</Button>)}
								</div>
								<Form.Label>Allergen tags</Form.Label>
								<div className="d-flex gap-2 flex-wrap">
									{ALLERGEN_OPTIONS.map((tag) => <Button key={tag} type="button" variant={(formRecipe.allergenTags || []).includes(tag) ? "primary" : "light"} aria-pressed={(formRecipe.allergenTags || []).includes(tag)} onClick={() => handleToggleTag("allergenTags", tag)}>{tag}</Button>)}
								</div>
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
														{...register(`recipeInstructions.${index}`)}
														value={instruction}
														onChange={(event) => handleArrayChange("recipeInstructions", index, event.target.value)}
														onPaste={(event) => handleArrayPaste("recipeInstructions", event, index)}
											/>

													<button
														name="recipeInstructions"
														className="btn btn-danger"
														type="button"
														disabled={
															formRecipe.recipeInstructions.length <= 1
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

							<div className="add__container__form__actions">
								<Button
									type="button"
									className="add__container__form__reset btn btn-light"
									onClick={handleReset}
								>
									Discard draft
								</Button>
								<Button
									type="button"
									className="add__container__form__save btn btn-light"
									onClick={handleSaveDraft}
									disabled={isSubmitting || !isDraftHydrated}
								>
									Save draft
								</Button>
								<Button
									type="submit"
									className="add__container__form__submit"
									disabled={disabled || isSubmitting}
								>
									{isSubmitting ? "Publishing…" : "Publish"}
								</Button>
							</div>
						</Form>
					</div>
				</div>
			</div>
		</main>
	);
};

export default AddRecipe;


