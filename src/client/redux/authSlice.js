import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
	name: "auth",
	initialState: {
		isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
		user: JSON.parse(localStorage.getItem("user")),
		token: localStorage.getItem("jwt"),
	},
	reducers: {
		login(state, action) {
			const { user, token } = action.payload;
			state.isAuthenticated = true;
			state.user = user;
			state.token = token;
			localStorage.setItem("isAuthenticated", true);
			localStorage.setItem("user", JSON.stringify(user));
			localStorage.setItem("jwt", token);
		},
		logout(state) {
			state.isAuthenticated = false;
			state.user = null;
			localStorage.setItem("isAuthenticated", false);
			localStorage.removeItem("user");
			localStorage.removeItem("jwt");
		},
	},
});

export const authActions = authSlice.actions;

export default authSlice;
