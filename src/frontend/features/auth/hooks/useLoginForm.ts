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

const loginSchema = Yup.object({
	email: Yup.string()
		.email("Invalid email")
		.required("Email is required"),
	password: Yup.string()
		.min(8, "Password must be at least 8 characters")
		.required("Password is required"),
});

type LoginFormData = Yup.InferType<typeof loginSchema>;

type LoginFormState = {
	formData: LoginFormData;
	remember: boolean;
	validated: boolean;
	errors: string[];
	isSubmitting: boolean;
};

type LoginAction =
	| { type: "SET_FORM_DATA"; payload: LoginFormData }
	| { type: "SET_REMEMBER" }
	| { type: "SET_VALIDATED"; payload: boolean }
	| { type: "SET_ERRORS"; payload: string[] }
	| { type: "SET_SUBMITTING"; payload: boolean };

const initialState: LoginFormState = {
	formData: {
		email: "",
		password: "",
	},
	remember: false,
	validated: false,
	errors: [],
	isSubmitting: false,
};

const reducer = (
	state: LoginFormState,
	action: LoginAction,
): LoginFormState => {
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

type LoginFieldName = keyof LoginFormData;

const isLoginFieldName = (name: string): name is LoginFieldName =>
	name === "email" || name === "password";

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

export type UseLoginFormResult = [
	LoginFormData,
	boolean,
	boolean,
	string[],
	boolean,
	(event: ChangeEvent<HTMLInputElement>) => void,
	(event: ChangeEvent<HTMLInputElement>) => void,
	(event: FormEvent<HTMLFormElement>) => void,
];

const useLoginForm = (): UseLoginFormResult => {
	const loginDispatch = useDispatch<AppDispatch>();
	const [state, dispatch] = useReducer(reducer, initialState);
	const navigate = useNavigate();
	const location = useLocation();
	const { showToast } = useToast();

	const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const { name, value } = event.target;
		if (!isLoginFieldName(name)) return;
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

	const handleRemember = (_event: ChangeEvent<HTMLInputElement>): void => {
		dispatch({ type: "SET_REMEMBER" });
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		dispatch({ type: "SET_SUBMITTING", payload: true });
		void loginSchema
			.validate(state.formData, { abortEarly: false })
			.then(async () => {
				try {
					const { email, password } = state.formData;
					const response = await axios.post<unknown>(
						apiRoutes.authLogin,
						JSON.stringify({ email, password, remember: state.remember }),
						{
							headers: { "Content-Type": "application/json" },
							withCredentials: true,
						},
					);
					if (response.status === 200) {
						if (!isAuthSession(response.data)) {
							throw new Error("The login response was invalid");
						}
						showToast({ title: "Welcome back" });
						dispatch({ type: "SET_VALIDATED", payload: true });
						const { user, token } = response.data;
						setAccessToken(token);
						if (state.remember) {
							loginDispatch(authActions.login({ user }));
						} else {
							loginDispatch(authActions.loginSession({ user }));
						}

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
						"Unable to log in. Please try again.",
					);
					dispatch({ type: "SET_ERRORS", payload: [message] });
					showToast({
						title: "Couldn’t sign you in",
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
