import { useMutation } from "@tanstack/react-query";
import { requestSuggestions, type SuggestionRequest } from "./suggestionsApi";

export const useSuggestionMutation = () => useMutation({
	mutationFn: (input: SuggestionRequest) => requestSuggestions(input),
});
