import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import ToastViewport from "@/shared/ui/ToastViewport";

const TOAST_DURATION_MS = 5000;
const TOAST_TYPES = new Set(["success", "error", "info", "warning"]);

const ToastContext = createContext({
	showToast: (..._args) => undefined,
	dismissToast: (..._args) => {},
});

export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);
	const timeoutRefs = useRef(new Map());

	const dismissToast = useCallback((toastId) => {
		setToasts((currentToasts) =>
			currentToasts.filter((toast) => toast.id !== toastId)
		);

		const timeoutId = timeoutRefs.current.get(toastId);
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutRefs.current.delete(toastId);
		}
	}, []);

	const showToast = useCallback((options = {}) => {
		const normalizedOptions =
			typeof options === "string" ? { title: options } : options;
		const title = normalizedOptions.title?.trim?.();

		if (!title) return undefined;

		const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const type = TOAST_TYPES.has(normalizedOptions.type)
			? normalizedOptions.type
			: "success";
		const message = normalizedOptions.message?.trim?.() || "";
		const duration = Number.isFinite(normalizedOptions.duration)
			? Math.max(1000, normalizedOptions.duration)
			: TOAST_DURATION_MS;

		setToasts((currentToasts) => [
			...currentToasts,
			{ id: toastId, title, message, type },
		]);

		const timeoutId = window.setTimeout(() => {
			dismissToast(toastId);
		}, duration);
		timeoutRefs.current.set(toastId, timeoutId);

		return toastId;
	}, [dismissToast]);

	useEffect(() => {
		return () => {
			timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
			timeoutRefs.current.clear();
		};
	}, []);

	return (
		<ToastContext.Provider value={{ showToast, dismissToast }}>
			{children}
			<ToastViewport toasts={toasts} onDismiss={dismissToast} />
		</ToastContext.Provider>
	);
};

export default ToastProvider;
