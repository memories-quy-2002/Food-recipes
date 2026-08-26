import { useCallback, useEffect, useState } from "react";

export const getCookingInstructions = (instructionsOrRecipe) => {
	const instructions = Array.isArray(instructionsOrRecipe)
		? instructionsOrRecipe
		: instructionsOrRecipe?.instructions;
	return Array.isArray(instructions)
		? instructions.filter(
				(instruction) =>
					instruction !== null &&
					instruction !== undefined &&
					(typeof instruction !== "string" || instruction.trim().length > 0)
			  )
		: [];
};

export const useCookingMode = (instructions, recipeIdentity = null, initialStepIndex = 0) => {
	const steps = getCookingInstructions(instructions);
	const instructionSignature = JSON.stringify(steps);
	const [stepIndex, setStepIndex] = useState(initialStepIndex);

	useEffect(() => {
		setStepIndex(initialStepIndex);
	}, [initialStepIndex, recipeIdentity, instructionSignature]);

	const goToStep = useCallback((nextIndex) => {
		setStepIndex((currentIndex) => {
			const boundedIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
			return steps.length > 0 ? boundedIndex : currentIndex;
		});
	}, [steps.length]);

	const safeStepIndex =
		steps.length > 0 ? Math.min(Math.max(stepIndex, 0), steps.length - 1) : 0;

	return {
		steps,
		stepIndex: safeStepIndex,
		isFirstStep: safeStepIndex === 0,
		isLastStep: steps.length > 0 && safeStepIndex === steps.length - 1,
		goToPrevious: () => goToStep(safeStepIndex - 1),
		goToNext: () => goToStep(safeStepIndex + 1),
	};
};
