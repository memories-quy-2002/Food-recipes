import { useReducer } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import axios from "../api/axios";
import { authActions } from "../redux/authSlice";
import { useDispatch } from "react-redux";

const initialState = {
	formData: {
		email: "",
		password: "",
	},
	remember: false,
	validated: false,
	errors: [],
	isSubmitting: false,
};

const reducer = (state, action) => {
	switch (action.type) {
		case "SET_FORM_DATA":
			return { ...state, formData: action.payload };
		case "SET_REMEMBER":
			return { ...state, remember: !state.remember };
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

const useLoginForm = () => {
	const loginDispatch = useDispatch();
	const [state, dispatch] = useReducer(reducer, initialState);
	const navigate = useNavigate();
	const location = useLocation();
	const redirectPath = location.state?.from || "/";

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

	const handleRemember = () => {
		dispatch({
			type: "SET_REMEMBER",
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		dispatch({ type: "SET_SUBMITTING", payload: true });
		const schema = Yup.object().shape({
			email: Yup.string()
				.email("Invalid email")
				.required("Email is required"),
			password: Yup.string()
				.min(8, "Password must be at least 8 characters")
				.required("Password is required"),
		});
		schema
			.validate(state.formData, { abortEarly: false })
			.then(async () => {
				try {
					const { email, password } = state.formData;
					const response = await axios.post(
						"/account/login",
						JSON.stringify({ email, password }),
						{
							headers: { "Content-Type": "application/json" },
							withCredentials: true,
						}
					);
					if (response.status === 200) {
						dispatch({ type: "SET_VALIDATED", payload: true });
						const user = response.data.user;
						if (state.remember) {
							const token = response.data.token;
							const payload = { user, token };
							loginDispatch(authActions.login(payload));
						} else {
							const token = response.data.token;
							const payload = { user, token };
							loginDispatch(authActions.loginSession(payload));
						}

						navigate(redirectPath, { replace: true });
					}
				} catch (err) {
					const message =
						err.response?.data?.message ||
						"Unable to log in. Please try again.";
					dispatch({
						type: "SET_ERRORS",
						payload: [message],
					});
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
		state.remember,
		state.validated,
		state.errors,
		state.isSubmitting,
		handleChange,
		handleRemember,
		handleSubmit,
	];
};

export default useLoginForm;
