import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearAccessToken } from "./authTokenStore";
import { isAuthUser, type AuthUser } from "../api/authSessionApi";

export type AuthBucket = {
	isAuthenticated: boolean;
	user: AuthUser | null;
};

export type AuthStoreState = {
	hydrated: boolean;
	local: AuthBucket;
	session: AuthBucket;
};

const parseStoredJson = (storage: Storage, key: string): unknown => {
	try {
		const value = storage.getItem(key);
		return value ? JSON.parse(value) : null;
	} catch {
		storage.removeItem(key);
		return null;
	}
};

const getStoredAuth = (storage: Storage): AuthBucket => {
	const storedUser = parseStoredJson(storage, "user");
	const user = isAuthUser(storedUser) ? storedUser : null;
	const isAuthenticated =
		storage.getItem("isAuthenticated") === "true" && user !== null;

	return {
		isAuthenticated,
		user: isAuthenticated ? user : null,
	};
};

const initialState: AuthStoreState = {
	hydrated: false,
	local: getStoredAuth(localStorage),
	session: getStoredAuth(sessionStorage),
};

type AuthUserPayload = {
	user: AuthUser;
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setHydrated(state, action: PayloadAction<boolean>) {
			state.hydrated = action.payload;
		},
		restoreSession(state, action: PayloadAction<AuthUserPayload>) {
			const { user } = action.payload;
			if (state.local.isAuthenticated) {
				state.local = { ...state.local, user };
				localStorage.setItem("user", JSON.stringify(user));
				return;
			}
			state.session = {
				...state.session,
				isAuthenticated: true,
				user,
			};
			sessionStorage.setItem("isAuthenticated", "true");
			sessionStorage.setItem("user", JSON.stringify(user));
		},
		updateUser(state, action: PayloadAction<AuthUserPayload>) {
			const { user } = action.payload;
			if (state.local.isAuthenticated) {
				state.local = { ...state.local, user };
				localStorage.setItem("user", JSON.stringify(user));
			} else {
				state.session = { ...state.session, user };
				sessionStorage.setItem("user", JSON.stringify(user));
			}
		},
		login(state, action: PayloadAction<AuthUserPayload>) {
			const { user } = action.payload;
			state.local = {
				...state.local,
				isAuthenticated: true,
				user,
			};
			localStorage.setItem("isAuthenticated", "true");
			localStorage.setItem("user", JSON.stringify(user));
		},
		loginSession(state, action: PayloadAction<AuthUserPayload>) {
			const { user } = action.payload;
			state.session = {
				...state.session,
				isAuthenticated: true,
				user,
			};
			sessionStorage.setItem("isAuthenticated", "true");
			sessionStorage.setItem("user", JSON.stringify(user));
		},
		logout(state) {
			clearAccessToken();
			state.local = {
				...state.local,
				isAuthenticated: false,
				user: null,
			};
			state.session = {
				...state.session,
				isAuthenticated: false,
				user: null,
			};
			localStorage.setItem("isAuthenticated", "false");
			localStorage.removeItem("user");
			localStorage.removeItem("jwt");
			sessionStorage.setItem("isAuthenticated", "false");
			sessionStorage.removeItem("user");
			sessionStorage.removeItem("jwt");
		},
	},
});

export const authActions = authSlice.actions;

export default authSlice;
