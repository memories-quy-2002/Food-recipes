import {
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type FormEvent,
	type KeyboardEvent,
	type ReactElement,
} from "react";
import { X } from "lucide-react";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Label from "@/shared/ui/Label";
import { cn } from "@/shared/lib/utils";
import {
	useFoodPreferencesQuery,
	useUpdateFoodPreferencesMutation,
} from "./api/preferencesQueries";
import type { FoodPreferences } from "./api/preferencesApi";

type ChipField = "avoidedAllergens" | "dislikedIngredients" | "preferredCuisines";
type ScalarField =
	| "diet"
	| "cookingSkill"
	| "maxWeekdayCookMinutes"
	| "defaultServings"
	| "maxCaloriesPerServing"
	| "minProteinGrams";
type PreferencesField = ChipField | ScalarField;
type PreferencesForm = Omit<FoodPreferences, ChipField | ScalarField> &
		Record<ChipField, string[]> & Record<ScalarField, string>;
type FieldErrors = Partial<Record<PreferencesField, string>>;
type ChipDraft = Record<ChipField, string>;

const chipFields: Array<{
	field: ChipField;
	legend: string;
	inputLabel: string;
	inputId: string;
	helper: string;
	maxItems: number;
	maxLength: number;
}> = [
	{
		field: "avoidedAllergens",
		legend: "Avoided allergens",
		inputLabel: "Avoided allergens",
		inputId: "avoided-allergens",
		helper: "Add foods that should never appear in your recommendations.",
		maxItems: 32,
		maxLength: 32,
	},
	{
		field: "dislikedIngredients",
		legend: "Disliked ingredients",
		inputLabel: "Disliked ingredients",
		inputId: "disliked-ingredients",
		helper: "These are avoided when possible. Turn on strict dislikes below to make them hard exclusions.",
		maxItems: 32,
		maxLength: 255,
	},
	{
		field: "preferredCuisines",
		legend: "Preferred cuisines",
		inputLabel: "Preferred cuisines",
		inputId: "preferred-cuisines",
		helper: "Add cuisines you would like to see more often.",
		maxItems: 16,
		maxLength: 64,
	},
];

const emptyChipDraft: ChipDraft = {
	avoidedAllergens: "",
	dislikedIngredients: "",
	preferredCuisines: "",
};

const toFormData = (
	preferences: FoodPreferences | null | undefined,
): PreferencesForm => ({
	diet: preferences?.diet ?? "",
	avoidedAllergens: preferences?.avoidedAllergens ?? [],
	dislikedIngredients: preferences?.dislikedIngredients ?? [],
	preferredCuisines: preferences?.preferredCuisines ?? [],
	cookingSkill: preferences?.cookingSkill ?? "",
	maxWeekdayCookMinutes:
		preferences?.maxWeekdayCookMinutes == null
			? ""
			: String(preferences.maxWeekdayCookMinutes),
	defaultServings: String(preferences?.defaultServings ?? 2),
	maxCaloriesPerServing:
		preferences?.maxCaloriesPerServing == null
			? ""
			: String(preferences.maxCaloriesPerServing),
	minProteinGrams:
		preferences?.minProteinGrams == null
			? ""
			: String(preferences.minProteinGrams),
	strictDislikes: preferences?.strictDislikes ?? false,
});

const toPayload = (formData: PreferencesForm): FoodPreferences => ({
	diet: formData.diet.trim() || null,
	avoidedAllergens: formData.avoidedAllergens.map((value) => value.trim()),
	dislikedIngredients: formData.dislikedIngredients.map((value) => value.trim()),
	preferredCuisines: formData.preferredCuisines.map((value) => value.trim()),
	cookingSkill: formData.cookingSkill.trim() || null,
	maxWeekdayCookMinutes: formData.maxWeekdayCookMinutes.trim()
		? Number(formData.maxWeekdayCookMinutes)
		: null,
	defaultServings: Number(formData.defaultServings),
	maxCaloriesPerServing: formData.maxCaloriesPerServing.trim()
		? Number(formData.maxCaloriesPerServing)
		: null,
	minProteinGrams: formData.minProteinGrams.trim()
		? Number(formData.minProteinGrams)
		: null,
	strictDislikes: formData.strictDislikes,
});

const validateList = (
	values: string[],
	maxItems: number,
	maxLength: number,
	label: string,
): string | undefined => {
	if (values.length > maxItems) return `Use no more than ${maxItems} ${label.toLowerCase()}.`;
	if (values.some((value) => value.length > maxLength)) {
		return `${label} must be ${maxLength} characters or fewer per item.`;
	}
	return undefined;
};

const validateNumber = (
	value: string,
	label: string,
	min: number,
	max: number,
	wholeNumber: boolean,
	rangeUnit = label.toLowerCase(),
	maxDecimalPlaces?: number,
): string | undefined => {
	if (!value.trim()) return `${label} is required.`;
	const number = Number(value);
	if (!Number.isFinite(number) || (wholeNumber && !Number.isInteger(number))) {
		return `${label} must be a valid ${wholeNumber ? "whole number" : "number"}.`;
	}
	if (
		maxDecimalPlaces !== undefined &&
		(String(number).split(".")[1]?.length ?? 0) > maxDecimalPlaces
	) {
		return `${label} must have no more than ${maxDecimalPlaces} decimal places.`;
	}
	if (number < min || number > max) return `Use between ${min} and ${max} ${rangeUnit}.`;
	return undefined;
};

const validateOptionalNumber = (
	value: string,
	label: string,
	min: number,
	max: number,
	wholeNumber: boolean,
	rangeUnit?: string,
	maxDecimalPlaces?: number,
): string | undefined =>
	value.trim()
		? validateNumber(value, label, min, max, wholeNumber, rangeUnit, maxDecimalPlaces)
		: undefined;

const validateForm = (formData: PreferencesForm): FieldErrors => {
	const errors: FieldErrors = {};
	chipFields.forEach(({ field, legend, maxItems, maxLength }) => {
		const error = validateList(formData[field], maxItems, maxLength, legend);
		if (error) errors[field] = error;
	});
	const numberErrors: Array<[
		ScalarField,
		string | undefined,
	]> = [
		[
			"maxWeekdayCookMinutes",
			validateOptionalNumber(
				formData.maxWeekdayCookMinutes,
				"Weekday maximum cooking time",
				10,
				240,
				true,
				"minutes",
			),
		],
		[
			"defaultServings",
			validateNumber(formData.defaultServings, "Default servings", 1, 24, true, "servings"),
		],
		[
			"maxCaloriesPerServing",
			validateOptionalNumber(
				formData.maxCaloriesPerServing,
				"Maximum calories per serving",
				100,
				5000,
				true,
				"calories per serving",
			),
		],
		[
			"minProteinGrams",
			validateOptionalNumber(
				formData.minProteinGrams,
				"Minimum protein",
				0,
				300,
				false,
				"grams of protein",
				2,
			),
		],
	];
	numberErrors.forEach(([field, error]) => {
		if (error) errors[field] = error;
	});
	return errors;
};

const getErrorMessage = (error: unknown): string =>
	error instanceof Error && error.message ? error.message : "Please try again.";

const FoodPreferencesPage = (): ReactElement => {
	const preferencesQuery = useFoodPreferencesQuery();
	const saveMutation = useUpdateFoodPreferencesMutation();
	const [formData, setFormData] = useState<PreferencesForm>(() => toFormData(null));
	const [chipDraft, setChipDraft] = useState<ChipDraft>(emptyChipDraft);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [saveError, setSaveError] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (preferencesQuery.data) setFormData(toFormData(preferencesQuery.data));
	}, [preferencesQuery.data]);

	useEffect(() => {
		if (Object.keys(fieldErrors).length === 0) return;
		formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	}, [fieldErrors]);

	const clearError = (field: PreferencesField): void => {
		setFieldErrors((current) => {
			if (!current[field]) return current;
			const next = { ...current };
			delete next[field];
			return next;
		});
		setSaveError(null);
	};

	const handleScalarChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
		const { name, value } = event.target;
		if (!Object.prototype.hasOwnProperty.call(formData, name)) return;
		setFormData((current) => ({ ...current, [name]: value }));
		clearError(name as ScalarField);
	};

	const addChip = (field: ChipField): void => {
		const value = chipDraft[field].trim();
		if (!value) return;
		setFormData((current) =>
			current[field].includes(value)
				? current
				: { ...current, [field]: [...current[field], value] },
		);
		setChipDraft((current) => ({ ...current, [field]: "" }));
		clearError(field);
	};

	const handleChipKeyDown = (
		field: ChipField,
		event: KeyboardEvent<HTMLInputElement>,
	): void => {
		if (event.key === "Enter") {
			event.preventDefault();
			addChip(field);
			return;
		}
		if (event.key === "Backspace" && !chipDraft[field] && formData[field].length > 0) {
			event.preventDefault();
			setFormData((current) => ({
				...current,
				[field]: current[field].slice(0, -1),
			}));
		}
	};

	const removeChip = (field: ChipField, value: string): void => {
		setFormData((current) => ({
			...current,
			[field]: current[field].filter((entry) => entry !== value),
		}));
		clearError(field);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		const errors = validateForm(formData);
		setFieldErrors(errors);
		setSaveError(null);
		if (Object.keys(errors).length > 0 || saveMutation.isPending) return;
		saveMutation.mutate(toPayload(formData), {
			onSuccess: (savedPreferences) => {
				setFormData(toFormData(savedPreferences));
				setChipDraft(emptyChipDraft);
			},
			onError: (error) => setSaveError(getErrorMessage(error)),
		});
	};

	if (preferencesQuery.isPending) {
		return <PageState title="Loading food preferences" message="Preparing your settings." />;
	}
	if (preferencesQuery.isError) {
		return (
			<PageState
				type="error"
				title="Food preferences could not load"
				message="We could not fetch your settings. Try again to keep recommendations useful."
				actionLabel="Try again"
				onAction={() => {
					void preferencesQuery.refetch();
				}}
			/>
		);
	}

	return (
		<main
			className="min-h-screen min-w-0 overflow-x-hidden bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
			aria-labelledby="food-preferences-title"
		>
			<PageHelmet
				title="Food preferences"
				description="Choose the foods, cooking style, and nutrition goals that shape your recipe recommendations."
				path="/profile/preferences"
				noIndex
			/>
			<div className="mx-auto w-full max-w-5xl min-w-0">
				<header className="mb-7 max-w-3xl">
					<p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-primary">
						Your kitchen, your rules
					</p>
					<h1 id="food-preferences-title" className="text-4xl font-black tracking-[-0.035em] sm:text-5xl">
						Food preferences
					</h1>
					<p className="mt-3 text-base leading-7 text-muted-foreground">
						Tell us what fits your table so future recipe suggestions feel more like yours.
					</p>
				</header>

				<section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
					<form
						ref={formRef}
						onSubmit={handleSubmit}
						className="grid min-w-0 gap-8"
						aria-label="Food preferences"
						noValidate
					>
						<fieldset className="grid min-w-0 gap-5">
							<legend className="text-2xl font-black tracking-tight">Taste and safety</legend>
							<div className="grid min-w-0 gap-5 sm:grid-cols-2">
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="diet">Diet</Label>
									<select
										id="diet"
										name="diet"
										value={formData.diet}
										onChange={handleScalarChange}
										className="min-h-12 w-full min-w-0 rounded-xl border border-input bg-background px-4 py-2.5 text-base leading-6 text-foreground shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 sm:text-sm"
									>
										<option value="">No preference</option>
										<option value="vegetarian">Vegetarian</option>
										<option value="vegan">Vegan</option>
										<option value="high-protein">High protein</option>
										<option value="pescatarian">Pescatarian</option>
									</select>
								</div>
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="cooking-skill">Cooking skill</Label>
									<select
										id="cooking-skill"
										name="cookingSkill"
										value={formData.cookingSkill}
										onChange={handleScalarChange}
										className="min-h-12 w-full min-w-0 rounded-xl border border-input bg-background px-4 py-2.5 text-base leading-6 text-foreground shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 sm:text-sm"
									>
										<option value="">No preference</option>
										<option value="beginner">Beginner</option>
										<option value="intermediate">Intermediate</option>
										<option value="advanced">Advanced</option>
									</select>
								</div>
							</div>

							{chipFields.map(({ field, legend, inputLabel, inputId, helper }) => {
								const errorId = `${field}-error`;
								const helperId = `${field}-help`;
								const error = fieldErrors[field];
								return (
									<div className="grid min-w-0 gap-2" key={field}>
										<fieldset className="grid min-w-0 gap-2">
											<legend className="text-sm font-extrabold leading-5 text-foreground">{legend}</legend>
											<p id={helperId} className="text-sm leading-6 text-muted-foreground">{helper}</p>
											<div className={cn(
												"flex min-w-0 flex-wrap gap-2 rounded-xl border border-input bg-background p-2 shadow-sm focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/20",
												error && "border-destructive ring-2 ring-destructive/20",
											)}>
												{formData[field].map((value) => (
													<span key={value} className="inline-flex max-w-full min-h-9 items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-sm font-bold text-accent-foreground">
														<span className="min-w-0 break-words">{value}</span>
														<button
														type="button"
															className="inline-flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
														aria-label={`Remove ${value}`}
														onClick={() => removeChip(field, value)}
													>
														<X className="size-4" aria-hidden="true" />
													</button>
													</span>
												))}
												<label htmlFor={inputId} className="sr-only">Add to {inputLabel.toLowerCase()}</label>
												<Input
													id={inputId}
													value={chipDraft[field]}
													aria-label={inputLabel}
													aria-invalid={Boolean(error)}
													aria-describedby={[helperId, error ? errorId : ""].filter(Boolean).join(" ")}
													placeholder="Type and press Enter"
													className="min-h-9 min-w-[9rem] flex-1 border-0 bg-transparent px-2 py-1 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0"
													onChange={(event) => setChipDraft((current) => ({ ...current, [field]: event.target.value }))}
													onKeyDown={(event) => handleChipKeyDown(field, event)}
												/>
											</div>
											{error && <p id={errorId} className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
										</fieldset>
									</div>
								);
							})}

							<label className="inline-flex min-h-11 items-center gap-3 text-sm font-bold text-foreground">
								<input
									type="checkbox"
									checked={formData.strictDislikes}
									onChange={(event) => {
										setFormData((current) => ({ ...current, strictDislikes: event.target.checked }));
										setSaveError(null);
									}}
									className="size-5 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								/>
								<span>Strictly exclude disliked ingredients</span>
							</label>
						</fieldset>

						<fieldset className="grid min-w-0 gap-5 border-t border-border pt-7">
							<legend className="text-2xl font-black tracking-tight">Cooking and nutrition goals</legend>
							<div className="grid min-w-0 gap-5 sm:grid-cols-2">
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="max-weekday-cook-minutes">Weekday maximum cooking time</Label>
									<Input id="max-weekday-cook-minutes" name="maxWeekdayCookMinutes" type="number" min="10" max="240" step="1" value={formData.maxWeekdayCookMinutes} onChange={handleScalarChange} aria-invalid={Boolean(fieldErrors.maxWeekdayCookMinutes)} aria-describedby={fieldErrors.maxWeekdayCookMinutes ? "maxWeekdayCookMinutes-error" : undefined} placeholder="No limit" />
									{fieldErrors.maxWeekdayCookMinutes && <p id="maxWeekdayCookMinutes-error" className="text-sm font-semibold text-destructive" role="alert">{fieldErrors.maxWeekdayCookMinutes}</p>}
								</div>
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="default-servings">Default servings</Label>
									<Input id="default-servings" name="defaultServings" type="number" min="1" max="24" step="1" value={formData.defaultServings} onChange={handleScalarChange} aria-invalid={Boolean(fieldErrors.defaultServings)} aria-describedby={fieldErrors.defaultServings ? "default-servings-error" : undefined} />
									{fieldErrors.defaultServings && <p id="default-servings-error" className="text-sm font-semibold text-destructive" role="alert">{fieldErrors.defaultServings}</p>}
								</div>
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="max-calories-per-serving">Maximum calories per serving</Label>
									<Input id="max-calories-per-serving" name="maxCaloriesPerServing" type="number" min="100" max="5000" step="1" value={formData.maxCaloriesPerServing} onChange={handleScalarChange} aria-invalid={Boolean(fieldErrors.maxCaloriesPerServing)} aria-describedby={fieldErrors.maxCaloriesPerServing ? "maxCaloriesPerServing-error" : undefined} placeholder="No limit" />
									{fieldErrors.maxCaloriesPerServing && <p id="maxCaloriesPerServing-error" className="text-sm font-semibold text-destructive" role="alert">{fieldErrors.maxCaloriesPerServing}</p>}
								</div>
								<div className="grid min-w-0 gap-2">
									<Label htmlFor="min-protein-grams">Minimum protein (g)</Label>
									<Input id="min-protein-grams" name="minProteinGrams" type="number" min="0" max="300" step="0.01" value={formData.minProteinGrams} onChange={handleScalarChange} aria-invalid={Boolean(fieldErrors.minProteinGrams)} aria-describedby={fieldErrors.minProteinGrams ? "minProteinGrams-error" : undefined} placeholder="No minimum" />
									{fieldErrors.minProteinGrams && <p id="minProteinGrams-error" className="text-sm font-semibold text-destructive" role="alert">{fieldErrors.minProteinGrams}</p>}
								</div>
							</div>
						</fieldset>

						{saveError && <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm font-semibold text-destructive">Your preferences could not be saved. {saveError}</div>}
						<div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
							<Button type="submit" size="lg" className="w-full sm:w-auto" disabled={saveMutation.isPending} aria-busy={saveMutation.isPending}>
								{saveMutation.isPending ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</form>
				</section>
			</div>
		</main>
	);
};

export default FoodPreferencesPage;
