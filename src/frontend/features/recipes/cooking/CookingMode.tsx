import React, { useEffect, useRef, useState } from "react";
import type { RecipeDetail } from "@/shared/api/contracts";
import { useCookingMode, getCookingInstructions } from "./useCookingMode";
import ManualTimer from "./ManualTimer";
import "./CookingMode.scss";

type CookingRecipe = Partial<RecipeDetail> & {
	id?: number | string;
	slug?: string;
};

type CookingModeProps = {
	recipe?: CookingRecipe | null;
	onExit: () => void;
	planningContext?: {
		date: string;
		slot: string;
		servings: number;
		returnTo?: string;
	};
	onBackToPlan?: () => void;
};

const useCookingModeWithIdentity = useCookingMode as (
	instructions: CookingRecipe["instructions"],
	recipeIdentity?: number | string | null
) => ReturnType<typeof useCookingMode>;

const formatPlanningContext = (planningContext: NonNullable<CookingModeProps["planningContext"]>) => {
	const weekday = new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		timeZone: "UTC",
	}).format(new Date(`${planningContext.date}T00:00:00Z`));
	const slot = planningContext.slot[0].toUpperCase() + planningContext.slot.slice(1);

	return `${weekday} · ${slot} · ${planningContext.servings} servings`;
};

const CookingMode = ({ recipe, onExit, planningContext, onBackToPlan }: CookingModeProps) => {
	const mainRef = useRef<HTMLElement | null>(null);
	const [isComplete, setIsComplete] = useState(false);
	const { steps, stepIndex, isFirstStep, isLastStep, goToPrevious, goToNext } =
		useCookingModeWithIdentity(
			recipe?.instructions,
			recipe?.recipe_id ?? recipe?.id ?? recipe?.slug ?? null
		);

	useEffect(() => {
		mainRef.current?.focus();
	}, []);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		if (event.key === "ArrowLeft" && !isFirstStep) {
			event.preventDefault();
			goToPrevious();
		}
		if (event.key === "ArrowRight" && !isLastStep) {
			event.preventDefault();
			goToNext();
		}
		if (event.key === "Escape") {
			event.preventDefault();
			onExit();
		}
	};

	const handleFinish = () => {
		if (planningContext) {
			setIsComplete(true);
			return;
		}

		onExit();
	};

	return (
		<main
			className="cooking-mode"
			ref={mainRef}
			tabIndex={-1}
			onKeyDown={handleKeyDown}
			aria-labelledby="cooking-mode-title"
		>
			<div className="cooking-mode__topbar">
				<p className="cooking-mode__eyebrow">Guided cooking</p>
				<button type="button" className="cooking-mode__exit" onClick={onExit}>
					Exit cooking
				</button>
			</div>
			<div className="cooking-mode__content">
				<h1 id="cooking-mode-title">{recipe?.recipe_name || "Cooking mode"}</h1>
				{planningContext && (
					<p className="cooking-mode__planning-context">
						{formatPlanningContext(planningContext)}
					</p>
				)}
				{isComplete ? (
					<section className="cooking-mode__complete" aria-live="polite">
						<p className="cooking-mode__eyebrow">Cooked with your plan</p>
						<h2>Recipe complete</h2>
						<p>Nice work. Keep this meal in your plan or review the recipe.</p>
						<div className="cooking-mode__complete-actions">
							{onBackToPlan && (
								<button type="button" onClick={onBackToPlan}>
									Back to plan
								</button>
							)}
							<button type="button" onClick={onExit}>
								Review Recipe
							</button>
						</div>
					</section>
				) : steps.length > 0 ? (
					<>
						<p className="cooking-mode__progress" aria-live="polite">
							Step {stepIndex + 1} of {steps.length}
						</p>
						<section className="cooking-mode__step" aria-label={`Step ${stepIndex + 1}`}>
							<p>{steps[stepIndex]}</p>
						</section>
						<ManualTimer />
						<div className="cooking-mode__controls">
							<button type="button" onClick={goToPrevious} disabled={isFirstStep}>
								Previous step
							</button>
							<button type="button" onClick={goToNext} disabled={isLastStep}>
								Next step
							</button>
							<button type="button" onClick={handleFinish} disabled={!isLastStep}>
								Finish cooking
							</button>
						</div>
						<p className="cooking-mode__keyboard-help">Use ← and → to move between steps. Press Escape to exit.</p>
					</>
				) : (
					<p className="cooking-mode__empty" role="status">
						This recipe does not have any cooking steps yet.
					</p>
				)}
			</div>
		</main>
	);
};

export { getCookingInstructions };
export default CookingMode;
