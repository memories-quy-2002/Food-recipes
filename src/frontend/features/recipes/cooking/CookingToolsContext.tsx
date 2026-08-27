import { createContext, useContext, type ReactNode } from "react";

type CookingToolsContextValue = {
	ingredients: unknown[] | null;
	storageKey: string | null;
};

const CookingToolsContext = createContext<CookingToolsContextValue>({
	ingredients: null,
	storageKey: null,
});

type CookingToolsProviderProps = CookingToolsContextValue & {
	children: ReactNode;
};

export const CookingToolsProvider = ({ ingredients, storageKey, children }: CookingToolsProviderProps) => (
	<CookingToolsContext.Provider value={{ ingredients, storageKey }}>
		{children}
	</CookingToolsContext.Provider>
);

export const useCookingTools = (): CookingToolsContextValue => useContext(CookingToolsContext);
