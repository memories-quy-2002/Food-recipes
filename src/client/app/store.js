import { configureStore } from "@reduxjs/toolkit";
import authSlice from "@/features/auth/state/authSlice";
const store = configureStore({
	reducer: {
		auth: authSlice.reducer,
	},
});

export default store;
