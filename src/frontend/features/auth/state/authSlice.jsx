import { createSlice } from "@reduxjs/toolkit";
import { clearAccessToken } from "./authTokenStore";

const parseStoredJson = (storage, key) => {
	try {
		const value = storage.getItem(key);
		return value ? JSON.parse(value) : null;
	} catch {
		storage.removeItem(key);
		return null;
	}
};

const getStoredAuth = (storage) => {
	const user = parseStoredJson(storage, "user");
	const isAuthenticated =
		storage.getItem("isAuthenticated") === "true" && Boolean(user);

	return {
		isAuthenticated,
		user: isAuthenticated ? user : null,
	};
};

const authSlice = createSlice({
	name: "auth",
	initialState: {
		hydrated: false,
		local: getStoredAuth(localStorage),
		session: getStoredAuth(sessionStorage),
	},
	reducers: {
		setHydrated(state, action) {
			state.hydrated = Boolean(action.payload);
		},
		restoreSession(state, action) {
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
			sessionStorage.setItem("isAuthenticated", true);
			sessionStorage.setItem("user", JSON.stringify(user));
		},
		updateUser(state, action) {
			const { user } = action.payload;
			if (state.local.isAuthenticated) {
				state.local = { ...state.local, user: user };
				localStorage.setItem("user", JSON.stringify(user));
			} else {
				state.session = { ...state.session, user: user };
				sessionStorage.setItem("user", JSON.stringify(user));
			}
		},
		login(state, action) {
			const { user } = action.payload;
			state.local = {
				...state.local,
				isAuthenticated: true,
				user: user,
			};
			localStorage.setItem("isAuthenticated", true);
			localStorage.setItem("user", JSON.stringify(user));
		},
		loginSession(state, action) {
			const { user } = action.payload;
			state.session = {
				...state.session,
				isAuthenticated: true,
				user: user,
			};
			sessionStorage.setItem("isAuthenticated", true);
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
			localStorage.setItem("isAuthenticated", false);
			localStorage.removeItem("user");
			localStorage.removeItem("jwt");
			sessionStorage.setItem("isAuthenticated", false);
			sessionStorage.removeItem("user");
			sessionStorage.removeItem("jwt");
		},
	},
});

export const authActions = authSlice.actions;

export default authSlice;
