import { createSlice } from "@reduxjs/toolkit";

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
	const token = storage.getItem("jwt");
	const isAuthenticated =
		storage.getItem("isAuthenticated") === "true" && Boolean(user);

	return {
		isAuthenticated,
		user: isAuthenticated ? user : null,
		token: isAuthenticated ? token : null,
	};
};

const authSlice = createSlice({
	name: "auth",
	initialState: {
		local: getStoredAuth(localStorage),
		session: getStoredAuth(sessionStorage),
	},
	reducers: {
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
			const { user, token } = action.payload;
			state.local = {
				...state.local,
				isAuthenticated: true,
				user: user,
				token: token,
			};
			localStorage.setItem("isAuthenticated", true);
			localStorage.setItem("user", JSON.stringify(user));
			localStorage.setItem("jwt", token);
		},
		loginSession(state, action) {
			const { user, token } = action.payload;
			state.session = {
				...state.session,
				isAuthenticated: true,
				user: user,
				token: token,
			};
			sessionStorage.setItem("isAuthenticated", true);
			sessionStorage.setItem("user", JSON.stringify(user));
			sessionStorage.setItem("jwt", token);
		},
		logout(state) {
			state.local = {
				...state.local,
				isAuthenticated: false,
				user: null,
				token: null,
			};
			state.session = {
				...state.session,
				isAuthenticated: false,
				user: null,
				token: null,
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
