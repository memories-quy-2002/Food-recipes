import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
	name: "auth",
	initialState: {
		local: {
			isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
			user: JSON.parse(localStorage.getItem("user")),
			token: localStorage.getItem("jwt"),
		},
		session: {
			isAuthenticated:
				sessionStorage.getItem("isAuthenticated") === "true",
			user: JSON.parse(sessionStorage.getItem("user")),
		},
	},
	reducers: {
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
			};
			localStorage.setItem("isAuthenticated", false);
			localStorage.removeItem("user");
			localStorage.removeItem("jwt");
			sessionStorage.setItem("isAuthenticated", false);
			sessionStorage.removeItem("user");
		},
	},
});

export const authActions = authSlice.actions;

export default authSlice;
