import cameraPreview from "@/shared/assets/images/cameraPreview.png";
import React, { useContext, useEffect, useMemo, useState } from "react";
import Button from "@/shared/ui/Button";
import { Form } from "@/shared/ui/Form";
import { Col, Row } from "@/shared/ui/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { serializeCreateRecipeDraftPayload } from "@/shared/api/mutations";
import { recipeQueryKeys } from "@/features/recipes/api/useRecipeQueries";
import { queryClient } from "@/shared/api/queryClient";
import { getArrayPayload } from "@/shared/api/payload";
import {
	isSupabaseStorageConfigured,
	uploadRecipeImage,
} from "@/shared/api/supabaseStorage";
import convertTime from "@/shared/utils/convertTime";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import { useToast } from "@/app/ToastProvider";
import {
	clearRecipeDraft,
	loadRecipeDraft,
	saveRecipeDraft,
} from "./recipeDraftStorage";
import { createRecipeFormSchema } from "./recipeForm.schema";
import { RecipeEditSaveError, saveRecipeEdits } from "./recipeEditorApi";

const DIETARY_OPTIONS = ["vegetarian", "vegan", "gluten-free", "dairy-free", "low-carb"];
const ALLERGEN_OPTIONS = ["wheat", "peanuts", "tree nuts", "milk", "eggs", "soy", "fish", "shellfish"];
const NUTRITION_FIELDS = ["servings", "calories", "protein", "carbohydrates", "fat", "fiber", "sugar", "sodium"];

const createInitialRecipeState = () => ({
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

const toDuration = (value, fallback) => {
	if (value && typeof value === "object" && "number" in value) {
		return {
			number: value.number ?? fallback,
			unit: value.unit || "minutes",
		};
	}
	return { number: value ?? fallback, unit: "minutes" };
};

const createInitialEditorState = ({ recipeId, initialRecipe }) => {
	const initialState = createInitialRecipeState();
	if (!initialRecipe) return initialState;
	const structuredSource = initialRecipe.structuredIngredients ?? initialRecipe.structured_ingredients;
	const structuredIngredients = Array.isArray(structuredSource)
		? structuredSource
		: Array.isArray(initialRecipe.recipeIngredients ?? initialRecipe.ingredients)
			? (initialRecipe.recipeIngredients ?? initialRecipe.ingredients).map((name, position) => ({
				position,
				quantityText: "",
				unit: "",
				name: String(name || ""),
				preparation: "",
			}))
			: initialState.structuredIngredients;

	return {
		...initialState,
		recipeName: initialRecipe.recipeName ?? initialRecipe.recipe_name ?? initialRecipe.name ?? "",
		recipeCategoryName: initialRecipe.recipeCategoryName ?? initialRecipe.category_name ?? "",
		recipeMealName: initialRecipe.recipeMealName ?? initialRecipe.meal_name ?? "",
		recipeDescription: initialRecipe.recipeDescription ?? initialRecipe.recipe_description ?? initialRecipe.description ?? "",
		recipeIngredients: initialRecipe.recipeIngredients ?? initialRecipe.ingredients ?? initialState.recipeIngredients,
		recipeInstructions: initialRecipe.recipeInstructions ?? initialRecipe.instructions ?? initialState.recipeInstructions,
		recipePrepTime: toDuration(initialRecipe.recipePrepTime ?? initialRecipe.prep_time_minutes ?? initialRecipe.prepTimeMinutes, initialState.recipePrepTime.number),
		recipeCookTime: toDuration(initialRecipe.recipeCookTime ?? initialRecipe.cook_time_minutes ?? initialRecipe.cookTimeMinutes, initialState.recipeCookTime.number),
		structuredIngredients,
		nutrition: { ...initialState.nutrition, ...(initialRecipe.nutrition || {}) },
		dietaryTags: initialRecipe.dietaryTags ?? initialRecipe.dietary_tags ?? initialState.dietaryTags,
		allergenTags: initialRecipe.allergenTags ?? initialRecipe.allergen_tags ?? initialState.allergenTags,
		serverRecipeId: recipeId ?? initialRecipe.recipe_id ?? initialRecipe.id ?? null,
	};
};

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

const getRecipeImageUrl = (recipe) => recipe?.imageUrl ?? recipe?.image_url ?? null;

const getEditErrorMessage = (error) => error?.response?.data?.message || error?.message || "Unable to save this recipe. Please try again.";

const getEditErrorSection = (error) => {
	if (!(error instanceof RecipeEditSaveError)) return "";
	return {
		base: "Recipe details",
		ingredients: "Structured ingredients",
		nutrition: "Nutrition",
		tags: "Dietary preferences",
		refresh: "Recipe refresh",
	}[error.section];
};

const RecipeEditor = ({ mode, recipeId = null, initialRecipe = null, onSaved }) => {
	const { auth } = useContext(AuthContext);
	const { userId } = auth.current;
	const { refreshRecipes } = useContext(RecipeContext);
	const { showToast } = useToast();
	const isCreateMode = mode === "create";
	const recipeStatus = initialRecipe?.status || "published";
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
		() => createRecipeFormSchema({ categories, meals, isPublishing: isCreateMode }),
		[categories, isCreateMode, meals]
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
		defaultValues: createInitialEditorState({ recipeId, initialRecipe }),
	});
	const formRecipe = watch();
	const draftFingerprint = JSON.stringify(formRecipe);
	const currentRestoreCandidate =
		restoreCandidate?.userId === String(userId) ? restoreCandidate : null;

	useEffect(() => {
		setRestoreCandidate(null);
		setIsDraftHydrated(false);
		setHydratedUserId(null);
		reset(createInitialEditorState({ recipeId, initialRecipe }));
		setPreview(isCreateMode ? null : initialRecipe?.imageUrl ?? initialRecipe?.image_url ?? null);

		if (!isCreateMode) {
			setIsDraftHydrated(true);
			setHydratedUserId(userId);
			return;
		}

		const savedDraft = loadRecipeDraft(window.localStorage, userId);
		if (savedDraft) {
			setRestoreCandidate(savedDraft);
			setHydratedUserId(userId);
			return;
		}
		setIsDraftHydrated(true);
		setHydratedUserId(userId);
	}, [initialRecipe, isCreateMode, recipeId, reset, userId]);

	useEffect(() => {
		if (
			!isCreateMode ||
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
	}, [currentRestoreCandidate, draftFingerprint, hydratedUserId, isCreateMode, isDraftHydrated, userId]);

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
		const currentIngredients = getValues("structuredIngredients") || [];
		setValue("structuredIngredients", [
			...currentIngredients,
			{ quantityText: "", unit: "", name: "", preparation: "" },
		], { shouldDirty: true });
	};
	const handleDeleteStructuredIngredient = (index) => {
		setDisabled(false);
		setSubmitError("");
		const remaining = (getValues("structuredIngredients") || []).filter((_, itemIndex) => itemIndex !== index);
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
		if (isCreateMode) clearRecipeDraft(window.localStorage, userId);
		reset(createInitialEditorState({ recipeId, initialRecipe }));
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
		if (isCreateMode) clearRecipeDraft(window.localStorage, userId);
		setRestoreCandidate(null);
		reset(createInitialEditorState({ recipeId, initialRecipe }));
		setIsDraftHydrated(true);
		setDraftStatus("idle");
	};

	const saveDraftLocally = (recipe) => {
		if (!isCreateMode) return false;
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
		if (!isCreateMode) return;
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

	const buildEditPayload = (values, imageUrl) => {
		const base = serializeCreateRecipeDraftPayload({
			recipe: values,
			categories,
			meals,
			imageUrl,
		});

		return {
			base: {
				...base,
				description: values.recipeDescription.trim(),
				ingredients: (values.recipeIngredients || []).map((ingredient) => ingredient.trim()).filter(Boolean),
				instructions: (values.recipeInstructions || []).map((instruction) => instruction.trim()).filter(Boolean),
			},
			ingredients: {
				ingredients: normalizeStructuredIngredients(values.structuredIngredients),
			},
			nutrition: normalizeNutritionPayload(values.nutrition),
			tags: {
				dietaryTags: values.dietaryTags || [],
				allergenTags: (values.allergenTags || []).map(normalizeAllergenTag),
			},
		};
	};

	const invalidateEditedRecipe = async (savedRecipeId) => {
		await Promise.all([
			refreshRecipes(),
			queryClient.invalidateQueries({ queryKey: recipeQueryKeys.detail(savedRecipeId) }),
			queryClient.invalidateQueries({ queryKey: ["users", "me", "recipes"] }),
		]);
	};

	const saveEditedRecipe = async (values) => {
		const resolvedRecipeId = Number(recipeId ?? initialRecipe?.recipe_id);
		if (!Number.isSafeInteger(resolvedRecipeId) || resolvedRecipeId < 1) {
			throw new Error("This recipe cannot be saved because its ID is invalid.");
		}

		let imageUrl = getRecipeImageUrl(initialRecipe);
		if (values.recipeImage) {
			imageUrl = (await uploadRecipeImage({ file: values.recipeImage, recipeName: values.recipeName.trim() })).url;
			setUploadStatus("saving");
		}
		const savedRecipe = await saveRecipeEdits(resolvedRecipeId, buildEditPayload(values, imageUrl));
		await invalidateEditedRecipe(resolvedRecipeId);
		setDisabled(true);
		return savedRecipe;
	};

	const handleSaveEditedRecipe = async (values, { publish = false } = {}) => {
		try {
			setIsSubmitting(true);
			setSubmitError("");
			setUploadStatus(values.recipeImage ? "uploading" : "saving");
			const savedRecipe = await saveEditedRecipe(values);
			const publishResponse = publish
				? await axios.post(apiRoutes.recipePublish(savedRecipe.recipe_id ?? recipeId))
				: null;
			const recipe = publishResponse?.data?.recipe || savedRecipe;
			if (publish) await invalidateEditedRecipe(recipe.recipe_id ?? recipeId);
			showToast({ title: publish ? "Recipe published successfully" : recipeStatus === "draft" ? "Draft saved" : "Recipe changes saved" });
			onSaved?.({ recipe, mode });
		} catch (error) {
			console.error("Unable to save recipe edits:", error);
			const section = getEditErrorSection(error);
			const message = getEditErrorMessage(error);
			setSubmitError(section ? `${section} could not be saved: ${message}` : message);
			showToast({ title: publish ? "Couldnâ€™t publish recipe" : "Couldnâ€™t save recipe", message, type: "error" });
		} finally {
			setUploadStatus("idle");
			setIsSubmitting(false);
		}
	};

	const handleSaveEditedDraft = () => handleSaveEditedRecipe(getValues());

	const handleEditSubmit = (values) => handleSaveEditedRecipe(values, { publish: recipeStatus === "draft" });

	const handleSubmit = async (values) => {
		if (!isCreateMode) return;
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
				if (isCreateMode) clearRecipeDraft(window.localStorage, userId);
				// Keep the existing compatibility boundary; the provider now invalidates the query cache.
				await refreshRecipes().catch((refreshError) =>
					console.error("Unable to refresh recipes after publish:", refreshError)
				);
				showToast({ title: "Recipe published successfully" });
				onSaved?.({ recipe: { ...cleanedRecipe, recipe_id: recipeId }, mode });
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
		<div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
			<div className="mx-auto w-full max-w-6xl">
				<div className="add__surface overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
					<div className="border-b border-border bg-secondary/45 p-5 sm:p-7 lg:p-9">
						<div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Recipe status">
							<span className="rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-primary-foreground">{isCreateMode ? "Draft" : "Editing"}</span>
							<span className="text-sm font-semibold text-muted-foreground" aria-live="polite">
								{draftStatus === "saving"
									? "Saving draft…"
									: draftStatus === "saved"
										? "Saved just now"
										: draftStatus === "error"
											? "Draft could not be saved locally"
											: "Local draft only"}
							</span>
						</div>
						<h1 className="text-4xl font-black tracking-[-0.035em] text-foreground sm:text-5xl">
							{isCreateMode ? "Create a new recipe" : "Edit recipe"}
						</h1>
						<p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
							Uploading personal recipes is easy! Add yours to
							your favorites, share with friends, family, or the
							community.
						</p>
					</div>
					<div className="p-4 sm:p-6 lg:p-8">
						{currentRestoreCandidate && (
							<div className="mb-4 rounded-2xl border border-primary/20 bg-secondary p-4 text-secondary-foreground" role="status">
								<strong>Restore your saved draft?</strong>
								<p>This draft is stored only in this browser for your account. Your current form will stay unchanged until you choose.</p>
								<div className="mt-3 flex flex-wrap gap-2">
									<Button type="button" onClick={handleRestoreDraft}>Restore draft</Button>
									<Button type="button" variant="outline" onClick={handleStartFresh}>Start fresh</Button>
								</div>
							</div>
						)}
						{!storageConfigured && (
							<div className="mb-4 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-destructive">
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
								className="mb-4 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-destructive"
								role="alert"
							>
							<strong>{isCreateMode ? "Recipe was not published" : "Recipe could not be saved"}</strong>
								<p>{submitError}</p>
							</div>
						)}
						{listError && (
							<div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
								<strong>Lists could not load</strong>
								<p>
									{listError} Publishing requires a category and meal from
									the supported lists.
								</p>
							</div>
						)}
						{uploadStatus !== "idle" && (
							<div className="mb-4 rounded-2xl border border-border bg-muted p-4 text-foreground" aria-live="polite">
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
						<Form noValidate className="space-y-1" onSubmit={handleRecipeSubmit(isCreateMode ? handleSubmit : handleEditSubmit, handleInvalidSubmit)}>
							<Row className="mb-8 grid gap-6 md:grid-cols-2">
								<Col className="w-full">
									<Form.Group
										controlId="formRecipeName"
										className="mb-6 grid gap-4"
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
										className="mb-6 grid gap-4"
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
								<Col className="w-full">
									<Form.Group
										controlId="formRecipeImage"
										className="grid gap-2"
									>
										<Form.Label>Image</Form.Label>
										{preview ? (
											<img
												src={preview}
												alt="This is a preview"
												width="800"
												height="600"
												className="aspect-[4/3] w-full rounded-2xl border border-border bg-muted object-cover"
											/>
										) : (
											<img
												src={cameraPreview}
												alt="Camera preview"
												width="800"
												height="600"
												className="aspect-[4/3] w-full rounded-2xl border border-border bg-muted object-cover"
											/>
										)}
										<Form.Control
											type="file"
											{...register("recipeImage")}
											accept="image/*"
											onChange={handleFileChange}
											className="mt-2"
										/>
										<p className="mt-2 text-sm leading-6 text-muted-foreground">
											Optional for drafts. Publishing uploads the image to
											Supabase Storage and stores its public URL.
										</p>
									</Form.Group>
								</Col>
							</Row>
							<Row className="mb-8 grid gap-6 md:grid-cols-2">
								<Col className="w-full">
									<Form.Group
										controlId="formRecipeCategoryName"
										className="mb-6 grid gap-4"
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
								<Col className="w-full">
									<Form.Group
										controlId="formRecipeMealName"
										className="mb-6 grid gap-4"
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

							<fieldset className="mb-5 rounded-2xl border border-border bg-muted/25 p-4 sm:p-5">
								<legend className="px-1 text-sm font-black uppercase tracking-[0.12em] text-foreground">Preparation time</legend>
								<div className="mt-2 grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
									<div className="grid gap-2">
										<label htmlFor="formRecipePrepTimeNumber" className="text-sm font-extrabold leading-5 text-foreground">Amount</label>
										<Form.Control
											id="formRecipePrepTimeNumber"
											type="number"
											inputMode="decimal"
											{...register("recipePrepTime.number", { onChange: handleTimeNumberChange })}
											value={formRecipe.recipePrepTime.number}
											min="1"
											step="any"
										/>
									</div>
									<div className="grid gap-2">
										<label htmlFor="formRecipePrepTimeUnit" className="text-sm font-extrabold leading-5 text-foreground">Unit</label>
										<Form.Select
											id="formRecipePrepTimeUnit"
											value={formRecipe.recipePrepTime.unit}
											{...register("recipePrepTime.unit", { onChange: handleSelectChange })}
										>
											<option value="seconds">Seconds</option>
											<option value="minutes">Minutes</option>
											<option value="hours">Hours</option>
											<option value="days">Days</option>
										</Form.Select>
									</div>
								</div>
							</fieldset>
							<fieldset className="mb-5 rounded-2xl border border-border bg-muted/25 p-4 sm:p-5">
								<legend className="px-1 text-sm font-black uppercase tracking-[0.12em] text-foreground">Cooking time</legend>
								<div className="mt-2 grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
									<div className="grid gap-2">
										<label htmlFor="formRecipeCookTimeNumber" className="text-sm font-extrabold leading-5 text-foreground">Amount</label>
										<Form.Control
											id="formRecipeCookTimeNumber"
											type="number"
											inputMode="decimal"
											{...register("recipeCookTime.number", { onChange: handleTimeNumberChange })}
											value={formRecipe.recipeCookTime.number}
											min="1"
											step="any"
										/>
									</div>
									<div className="grid gap-2">
										<label htmlFor="formRecipeCookTimeUnit" className="text-sm font-extrabold leading-5 text-foreground">Unit</label>
										<Form.Select
											id="formRecipeCookTimeUnit"
											value={formRecipe.recipeCookTime.unit}
											{...register("recipeCookTime.unit", { onChange: handleSelectChange })}
										>
											<option value="seconds">Seconds</option>
											<option value="minutes">Minutes</option>
											<option value="hours">Hours</option>
											<option value="days">Days</option>
										</Form.Select>
									</div>
								</div>
							</fieldset>

							<div className="mb-7 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-secondary/55 px-4 py-3 text-secondary-foreground sm:px-5">
								<strong className="text-sm font-black uppercase tracking-[0.12em]">Total time</strong>
								<p className="font-black tabular-nums">
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
								className="mb-7 grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
							>
								<Form.Label>Structured ingredients</Form.Label>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">Add quantities and units when known. Nutrition is entered manually below.</p>
								{(formRecipe.structuredIngredients || []).map((ingredient, index) => (
									<div key={index} className="mb-3 grid gap-2 sm:grid-cols-[auto_0.7fr_0.8fr_1.5fr_1.2fr_auto] sm:items-center">
										<span aria-hidden="true">{index + 1}.</span>
										<Form.Control aria-label={`Ingredient ${index + 1} quantity`} placeholder="Qty" value={ingredient.quantityText || ""} onChange={(event) => handleStructuredChange(index, "quantityText", event.target.value)} />
										<Form.Control aria-label={`Ingredient ${index + 1} unit`} placeholder="Unit" value={ingredient.unit || ""} onChange={(event) => handleStructuredChange(index, "unit", event.target.value)} />
										<Form.Control aria-label={`Ingredient ${index + 1} name`} placeholder="Ingredient name" value={ingredient.name || ""} onChange={(event) => handleStructuredChange(index, "name", event.target.value)} />
										<Form.Control aria-label={`Ingredient ${index + 1} preparation`} placeholder="Preparation (optional)" value={ingredient.preparation || ""} onChange={(event) => handleStructuredChange(index, "preparation", event.target.value)} />
										<Button variant="destructive" type="button" onClick={() => handleDeleteStructuredIngredient(index)} disabled={(formRecipe.structuredIngredients || []).length <= 1}>Remove</Button>
									</div>
								))}
								<Button variant="outline" type="button" onClick={handleAddStructuredIngredient}>+ Add ingredient</Button>
								{formRecipe.recipeIngredients.some((ingredient) => ingredient.trim()) && (
									<div className="rounded-xl border border-border bg-background px-3 py-3 text-sm leading-6 text-muted-foreground" role="status">
										<strong className="text-foreground">Older draft notes preserved</strong>
										<p>These notes will stay attached to this draft. Use the structured ingredient rows above for new edits.</p>
									</div>
								)}
							</Form.Group>

							<fieldset className="mb-7 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
								<legend className="px-1 text-base font-black text-foreground">Nutrition per serving</legend>
								<p id="nutrition-help" className="mt-1 text-sm leading-6 text-muted-foreground">Optional manual values. These numbers are not calculated or medically verified.</p>
								<div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-4">
									{NUTRITION_FIELDS.map((field) => (
										<div className="grid gap-2" key={field}>
											<label htmlFor={`nutrition-${field}`} className="text-sm font-extrabold capitalize leading-5 text-foreground">{field}</label>
											<Form.Control id={`nutrition-${field}`} type="number" inputMode="decimal" min="0" step="any" placeholder="Optional" aria-describedby="nutrition-help" {...register(`nutrition.${field}`, { onChange: handleInputChange })} value={formRecipe.nutrition?.[field] || ""} />
										</div>
									))}
								</div>
							</fieldset>

							<fieldset className="mb-7 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
								<legend className="px-1 text-base font-black text-foreground">Dietary preferences</legend>
								<p id="dietary-help" className="mt-1 text-sm leading-6 text-muted-foreground">Select all that apply to this recipe.</p>
								<div className="mt-4 flex flex-wrap gap-2" role="group" aria-labelledby="dietary-label" aria-describedby="dietary-help">
									<span id="dietary-label" className="sr-only">Dietary preferences</span>
									{DIETARY_OPTIONS.map((tag) => {
										const isSelected = (formRecipe.dietaryTags || []).includes(tag);
										return <Button key={tag} type="button" variant={isSelected ? "secondary" : "outline"} className={`capitalize ${isSelected ? "border-primary ring-1 ring-primary/30" : ""}`} aria-pressed={isSelected} onClick={() => handleToggleTag("dietaryTags", tag)}>{isSelected && <span aria-hidden="true">✓</span>}{tag}</Button>;
									})}
								</div>
								<div className="mt-6 border-t border-border pt-5" aria-labelledby="allergen-label">
									<h3 id="allergen-label" className="text-sm font-black uppercase tracking-[0.12em] text-foreground">Allergen tags</h3>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">Mark ingredients that may be relevant to your guests.</p>
									<div className="mt-4 flex flex-wrap gap-2" role="group" aria-labelledby="allergen-label">
										{ALLERGEN_OPTIONS.map((tag) => {
											const isSelected = (formRecipe.allergenTags || []).includes(tag);
											return <Button key={tag} type="button" variant={isSelected ? "secondary" : "outline"} className={`capitalize ${isSelected ? "border-primary ring-1 ring-primary/30" : ""}`} aria-pressed={isSelected} onClick={() => handleToggleTag("allergenTags", tag)}>{isSelected && <span aria-hidden="true">✓</span>}{tag}</Button>;
										})}
									</div>
								</div>
							</fieldset>
							<Form.Group
								controlId="formRecipeInstructions"
								className="mb-7 grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
							>
								<Form.Label>Instructions</Form.Label>
								{formRecipe.recipeInstructions.map(
									(instruction, index) => (
										<div
											key={index}
											className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start"
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
														className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
									className="inline-flex min-h-11 items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									type="button"
									onClick={handleAddField}
								>
									+ Add instruction
								</button>
							</Form.Group>

							<div className="sticky bottom-3 z-10 mt-8 grid gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur sm:grid-cols-[auto_auto_minmax(140px,1fr)] sm:items-center">
								<Button
									type="button"
									variant="outline"
									className="w-full sm:w-auto"
									onClick={handleReset}
								>
									{isCreateMode ? "Discard draft" : "Discard changes"}
								</Button>
				{isCreateMode && <>
					<Button
						type="button"
						variant="secondary"
						className="w-full sm:w-auto"
						onClick={handleSaveDraft}
						disabled={isSubmitting || !isDraftHydrated}
					>
						Save draft
					</Button>
					<Button
						type="submit"
						className="w-full sm:justify-self-end"
						disabled={disabled || isSubmitting}
					>
						{isSubmitting ? "Publishing…" : "Publish"}
					</Button>
				</>}
				{!isCreateMode && recipeStatus === "draft" && <>
					<Button
						type="button"
						variant="secondary"
						className="w-full sm:w-auto"
						onClick={handleSaveEditedDraft}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Savingâ€¦" : "Save draft"}
					</Button>
					<Button
						type="submit"
						className="w-full sm:justify-self-end"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Publishingâ€¦" : "Publish"}
					</Button>
				</>}
				{!isCreateMode && recipeStatus === "published" && <Button
					type="submit"
					className="w-full sm:justify-self-end"
					disabled={disabled || isSubmitting}
				>
					{isSubmitting ? "Saving changesâ€¦" : "Save changes"}
				</Button>}
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RecipeEditor;
