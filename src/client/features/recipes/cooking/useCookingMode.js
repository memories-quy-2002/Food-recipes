import { useCallback, useMemo, useState } from "react";

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

export const useCookingMode = (instructions) => {
	const steps = useMemo(() => getCookingInstructions(instructions), [instructions]);
	const [stepIndex, setStepIndex] = useState(0);

	const goToStep = useCallback((nextIndex) => {
		setStepIndex((currentIndex) => {
			const boundedIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
			return steps.length > 0 ? boundedIndex : currentIndex;
		});
	}, [steps.length]);

	return {
		steps,
		stepIndex,
		isFirstStep: stepIndex === 0,
		isLastStep: steps.length > 0 && stepIndex === steps.length - 1,
		goToPrevious: () => goToStep(stepIndex - 1),
		goToNext: () => goToStep(stepIndex + 1),
	};
};
