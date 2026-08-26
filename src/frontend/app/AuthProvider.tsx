import {
	createContext,
	useEffect,
	useRef,
	type MutableRefObject,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "@/features/auth/state/authSlice";
import { getAccessToken } from "@/features/auth/state/authTokenStore";
import {
	authSessionApi,
	type AuthSessionWithToken,
	type AuthUser,
} from "@/features/auth/api/authSessionApi";
import type { AppDispatch, RootState } from "./store";

export type AuthState = {
	isAuthenticated: boolean;
	hydrated: boolean;
	user: AuthUser | null;
	userId: number;
	token: string | null;
};

export type AuthContextValue = {
	auth: MutableRefObject<AuthState>;
};

const defaultAuthState: AuthState = {
	isAuthenticated: false,
	hydrated: false,
	user: null,
	userId: 0,
	token: null,
};

export const AuthContext = createContext<AuthContextValue>({
	auth: { current: defaultAuthState },
});

const AuthProvider = ({
	children,
}: PropsWithChildren): ReactElement => {
	const auth = useRef<AuthState>(defaultAuthState);
	const bootstrapPromise = useRef<Promise<AuthSessionWithToken> | null>(null);
	const dispatch = useDispatch<AppDispatch>();

	const { hydrated, local, session } = useSelector(
		(state: RootState) => state.auth,
	);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const activeBucket = local.isAuthenticated ? local : session;
	const user = isAuthenticated ? activeBucket.user : null;
	const userId = isAuthenticated ? user?.user_id ?? 0 : 0;
	const token = isAuthenticated ? getAccessToken() : null;

	useEffect(() => {
		let active = true;
		bootstrapPromise.current ??= authSessionApi.refresh();
		bootstrapPromise.current
			.then(({ user: refreshedUser }) => {
				if (active) {
					dispatch(authActions.restoreSession({ user: refreshedUser }));
				}
			})
			.catch(() => {
				if (active && !getAccessToken()) dispatch(authActions.logout());
			})
			.finally(() => {
				if (active) dispatch(authActions.setHydrated(true));
			});

		const handleExpiredAuth = (): void => {
			dispatch(authActions.logout());
		};

		window.addEventListener("auth:expired", handleExpiredAuth);
		return () => {
			active = false;
			window.removeEventListener("auth:expired", handleExpiredAuth);
		};
	}, [dispatch]);

	auth.current = {
		isAuthenticated,
		hydrated,
		user,
		userId,
		token,
	};

	return (
		<AuthContext.Provider value={{ auth }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthProvider;
