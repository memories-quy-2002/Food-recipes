import { useCallback, useEffect, useState } from "react";

export type CookingInstructionSource =
	| string[]
	| { instructions?: string[] | null }
	| null
	| undefined;

export type CookingModeResult = {
	steps: string[];
	stepIndex: number;
	isFirstStep: boolean;
	isLastStep: boolean;
	goToPrevious: () => void;
	goToNext: () => void;
};

export const getCookingInstructions = (
	instructionsOrRecipe: CookingInstructionSource,
): string[] => {
	const instructions = Array.isArray(instructionsOrRecipe)
		? instructionsOrRecipe
		: instructionsOrRecipe?.instructions;
	return Array.isArray(instructions)
		? instructions.filter(
				(instruction): instruction is string =>
					typeof instruction === "string" && instruction.trim().length > 0,
			  )
		: [];
};

export const useCookingMode = (
	instructions: CookingInstructionSource,
	recipeIdentity: number | string | null = null,
	initialStepIndex = 0,
): CookingModeResult => {
	const steps = getCookingInstructions(instructions);
	const instructionSignature = JSON.stringify(steps);
	const [stepIndex, setStepIndex] = useState(initialStepIndex);

	useEffect(() => {
		setStepIndex(initialStepIndex);
	}, [initialStepIndex, recipeIdentity, instructionSignature]);

	const goToStep = useCallback((nextIndex: number) => {
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
