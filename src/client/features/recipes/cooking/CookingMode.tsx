import React, { useEffect, useRef } from "react";
import { useCookingMode, getCookingInstructions } from "./useCookingMode";
import "./CookingMode.scss";

const CookingMode = ({ recipe, onExit }) => {
	const mainRef = useRef(null);
	const { steps, stepIndex, isFirstStep, isLastStep, goToPrevious, goToNext } =
		useCookingMode(recipe?.instructions);

	useEffect(() => {
		mainRef.current?.focus();
	}, []);

	const handleKeyDown = (event) => {
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
				{steps.length > 0 ? (
					<>
						<p className="cooking-mode__progress" aria-live="polite">
							Step {stepIndex + 1} of {steps.length}
						</p>
						<section className="cooking-mode__step" aria-label={`Step ${stepIndex + 1}`}>
							<p>{steps[stepIndex]}</p>
						</section>
						<div className="cooking-mode__controls">
							<button type="button" onClick={goToPrevious} disabled={isFirstStep}>
								Previous step
							</button>
							<button type="button" onClick={goToNext} disabled={isLastStep}>
								Next step
							</button>
							<button type="button" onClick={onExit} disabled={!isLastStep}>
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
