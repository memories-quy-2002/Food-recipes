import { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import axios from "../api/axios";
import { authActions } from "../redux/authSlice";
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
};

const reducer = (state, action) => {
	switch (action.type) {
		case "SET_FORM_DATA":
			return { ...state, formData: action.payload };
		case "SET_VALIDATED":
			return { ...state, validated: action.payload };
		case "SET_ERRORS":
			return { ...state, errors: action.payload };
		default:
			return state;
	}
};

const useForm = () => {
	const loginDispatch = useDispatch();
	const [state, dispatch] = useReducer(reducer, initialState);
	const navigate = useNavigate();
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
	};
	const handleSubmit = (e) => {
		e.preventDefault();
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
						"/account/signup",
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
						console.log(response);
						navigate("/");
					}
				} catch (err) {
					console.error(err);
				}
			})
			.catch((err) => {
				dispatch({ type: "SET_VALIDATED", payload: false });
				dispatch({ type: "SET_ERRORS", payload: err.errors });
			});
	};

	return [
		state.formData,
		state.validated,
		state.errors,
		handleName,
		handleChange,
		handleSubmit,
	];
};

export default useForm;
