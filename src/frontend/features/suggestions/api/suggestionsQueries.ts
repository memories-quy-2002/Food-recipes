import { useMutation } from "@tanstack/react-query";
import { requestSuggestions, type SuggestionRequest } from "./suggestionsApi";
import { useToast } from "@/app/ToastProvider";

export const useSuggestionMutation = () => {
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (input: SuggestionRequest) => requestSuggestions(input),
		onSuccess: () => showToast({ title: "Suggestions ready" }),
		onError: () => showToast({ title: "Suggestions could not load", message: "Please try again.", type: "error" }),
	});
};
