import { useReducer, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { isAxiosError } from "axios";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import { authActions } from "@/features/auth/state/authSlice";
import { setAccessToken } from "@/features/auth/state/authTokenStore";
import {
	consumeAuthIntent,
	getAuthReturnPath,
} from "@/features/auth/returnIntent";
import { useToast } from "@/app/ToastProvider";
import { isAuthSession } from "@/features/auth/api/authSessionApi";
import type { AppDispatch } from "@/app/store";

const signupSchema = Yup.object({
	name: Yup.object({
		first: Yup.string().required("First name is required"),
		last: Yup.string().required("Last name is required"),
	}).required(),
	email: Yup.string()
		.email("Invalid email")
		.required("Email is required"),
	password: Yup.string()
		.min(8, "Password must be at least 8 characters")
		.required("Password is required"),
	confirmPassword: Yup.string()
		.oneOf([Yup.ref("password")], "Passwords must match")
		.required("Confirm password is required"),
});

type SignupFormData = Yup.InferType<typeof signupSchema>;

type SignupFormState = {
	formData: SignupFormData;
	validated: boolean;
	errors: string[];
	isSubmitting: boolean;
};

type SignupAction =
	| { type: "SET_FORM_DATA"; payload: SignupFormData }
	| { type: "SET_VALIDATED"; payload: boolean }
	| { type: "SET_ERRORS"; payload: string[] }
	| { type: "SET_SUBMITTING"; payload: boolean };

const initialState: SignupFormState = {
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

const reducer = (
	state: SignupFormState,
	action: SignupAction,
): SignupFormState => {
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

type SignupNameField = keyof SignupFormData["name"];
type SignupFieldName = Exclude<keyof SignupFormData, "name">;

const isSignupNameField = (name: string): name is SignupNameField =>
	name === "first" || name === "last";

const isSignupFieldName = (name: string): name is SignupFieldName =>
	name === "email" || name === "password" || name === "confirmPassword";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
	if (!isAxiosError(error)) return fallback;
	const data = error.response?.data;
	return isRecord(data) && typeof data.message === "string"
		? data.message
		: fallback;
};

const getValidationErrors = (error: unknown): string[] =>
	error instanceof Yup.ValidationError && error.errors.length > 0
		? error.errors
		: ["Please check your details and try again."];

export type UseSignupFormResult = [
	SignupFormData,
	boolean,
	string[],
	boolean,
	(event: ChangeEvent<HTMLInputElement>) => void,
	(event: ChangeEvent<HTMLInputElement>) => void,
	(event: FormEvent<HTMLFormElement>) => void,
];

const useSignupForm = (): UseSignupFormResult => {
	const loginDispatch = useDispatch<AppDispatch>();
	const [state, dispatch] = useReducer(reducer, initialState);
	const navigate = useNavigate();
	const location = useLocation();
	const { showToast } = useToast();

	const handleName = (event: ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = event.target;
		if (!isSignupNameField(name)) return;
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

	const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = event.target;
		if (!isSignupFieldName(name)) return;
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

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		dispatch({ type: "SET_SUBMITTING", payload: true });
		void signupSchema
			.validate(state.formData, { abortEarly: false })
			.then(async () => {
				try {
					const { name, email, password } = state.formData;
					const response = await axios.post<unknown>(
						apiRoutes.authSignup,
						JSON.stringify({ name, email, password }),
						{
							headers: { "Content-Type": "application/json" },
							withCredentials: true,
						},
					);
					if ([200, 201].includes(response.status)) {
						if (!isAuthSession(response.data)) {
							throw new Error("The signup response was invalid");
						}
						showToast({ title: "Account created" });
						dispatch({ type: "SET_VALIDATED", payload: true });

						const { user, token } = response.data;
						setAccessToken(token);
						loginDispatch(authActions.login({ user }));
						const pendingIntent = consumeAuthIntent();
						const redirectPath = getAuthReturnPath(location);
						navigate(redirectPath, {
							replace: true,
							state: pendingIntent
								? { pendingAuthIntent: pendingIntent }
								: null,
						});
					}
				} catch (error: unknown) {
					const message = getApiErrorMessage(
						error,
						"Unable to create your account. Please try again.",
					);
					dispatch({ type: "SET_ERRORS", payload: [message] });
					showToast({
						title: "Couldn’t create your account",
						message,
						type: "error",
					});
				} finally {
					dispatch({ type: "SET_SUBMITTING", payload: false });
				}
			})
			.catch((error: unknown) => {
				dispatch({ type: "SET_VALIDATED", payload: false });
				dispatch({
					type: "SET_ERRORS",
					payload: getValidationErrors(error),
				});
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
