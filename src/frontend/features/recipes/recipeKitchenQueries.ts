import type { QueryClient } from "@tanstack/react-query";
import { historyQueryKeys } from "@/features/history/api/historyQueries";
import { pantryQueryKeys } from "@/features/pantry/api/pantryQueries";

export const refreshKitchenQueries = async (queryClient: QueryClient): Promise<void> => {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: ["home-feed"] }),
		queryClient.invalidateQueries({ queryKey: historyQueryKeys.all }),
		queryClient.invalidateQueries({ queryKey: ["planning"] }),
		queryClient.invalidateQueries({ queryKey: pantryQueryKeys.all }),
	]);
};
