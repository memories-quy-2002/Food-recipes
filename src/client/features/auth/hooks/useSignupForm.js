import { useReducer } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { authActions } from "@/features/auth/state/authSlice";
import { useDispatch } from "react-redux";

const initialState = {
	formData: {
		name: { first: "", last: "" },
		email: "",
		password: "",
		confirmPassword: "",
	},
	validated: false,
	errors: [],
	isSubmitting: false,
};

const reducer = (state, action) => {
	switch (action.type) {
		case "SET_FORM_DATA":
			return { ...state, formData: action.payload };
		case "SET_VALIDATED":
			return { ...state, validated: action.payload };
		case "SET_ERRORS":
			return { ...state, errors: action.payload };
		case "SET_SUBMITTING":
			return { ...state, isSubmitting: action.payload };
		default:
			return state;
	}
};

const useSignupForm = () => {
	const loginDispatch = useDispatch();
	const [state, dispatch] = useReducer(reducer, initialState);
	const navigate = useNavigate();
	const location = useLocation();
	const redirectPath = location.state?.from || "/";
	const handleName = (e) => {
		const { name, value } = e.target;
		dispatch({
			type: "SET_FORM_DATA",
			payload: {
				...state.formData,
				name: {
					...state.formData.name,
					[name]: value,
				},
			},
		});
		if (state.errors.length > 0) {
			dispatch({ type: "SET_ERRORS", payload: [] });
		}
	};
	const handleChange = (e) => {
		const { name, value } = e.target;
		dispatch({
			type: "SET_FORM_DATA",
			payload: {
				...state.formData,
				[name]: value,
			},
		});
		if (state.errors.length > 0) {
			dispatch({ type: "SET_ERRORS", payload: [] });
		}
	};
	const handleSubmit = (e) => {
		e.preventDefault();
		dispatch({ type: "SET_SUBMITTING", payload: true });
		const schema = Yup.object().shape({
			name: Yup.object().shape({
				first: Yup.string().required("First name is required"),
				last: Yup.string().required("Last name is required"),
			}),
			email: Yup.string()
				.email("Invalid email")
				.required("Email is required"),
			password: Yup.string()
				.min(8, "Password must be at least 8 characters")
				.required("Password is required"),
			confirmPassword: Yup.string()
				.oneOf([Yup.ref("password"), null], "Passwords must match")
				.required("Confirm password is required"),
		});
		schema
			.validate(state.formData, { abortEarly: false })
			.then(async () => {
				try {
					const { name, email, password } = state.formData;
					const response = await axios.post(
						apiRoutes.authSignup,
						JSON.stringify({ name, email, password }),
						{
							headers: { "Content-Type": "application/json" },
							withCredentials: true,
						}
					);
					if (response.status === 200) {
						dispatch({ type: "SET_VALIDATED", payload: true });

						const { user, token } = response.data;
						loginDispatch(authActions.login({ user, token }));
						navigate(redirectPath, { replace: true });
					}
				} catch (err) {
					const message =
						err.response?.data?.message ||
						"Unable to create your account. Please try again.";
					dispatch({ type: "SET_ERRORS", payload: [message] });
				} finally {
					dispatch({ type: "SET_SUBMITTING", payload: false });
				}
			})
			.catch((err) => {
				dispatch({ type: "SET_VALIDATED", payload: false });
				dispatch({ type: "SET_ERRORS", payload: err.errors });
				dispatch({ type: "SET_SUBMITTING", payload: false });
			});
	};

	return [
		state.formData,
		state.validated,
		state.errors,
		state.isSubmitting,
		handleName,
		handleChange,
		handleSubmit,
	];
};

export default useSignupForm;
