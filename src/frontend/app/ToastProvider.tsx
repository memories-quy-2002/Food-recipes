import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type PropsWithChildren,
} from "react";
import ToastViewport from "@/shared/ui/ToastViewport";

const TOAST_DURATION_MS = 5000;
const TOAST_TYPES = new Set(["success", "error", "info", "warning"]);

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastOptions = {
	title?: string;
	message?: string;
	type?: ToastType;
	duration?: number;
};

export type Toast = {
	id: string;
	title: string;
	message: string;
	type: ToastType;
};

export type ToastContextValue = {
	showToast: (options?: string | ToastOptions) => string | undefined;
	dismissToast: (toastId: string) => void;
};

const ToastContext = createContext<ToastContextValue>({
	showToast: () => undefined,
	dismissToast: () => undefined,
});

export const useToast = (): ToastContextValue => useContext(ToastContext);

const isToastType = (value: ToastType | undefined): value is ToastType =>
	value !== undefined && TOAST_TYPES.has(value);

const ToastProvider = ({
	children,
}: PropsWithChildren): React.ReactElement => {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timeoutRefs = useRef<Map<string, number>>(new Map());

	const dismissToast = useCallback((toastId: string): void => {
		setToasts((currentToasts) =>
			currentToasts.filter((toast) => toast.id !== toastId),
		);

		const timeoutId = timeoutRefs.current.get(toastId);
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			timeoutRefs.current.delete(toastId);
		}
	}, []);

	const showToast = useCallback(
		(options: string | ToastOptions = {}): string | undefined => {
			const normalizedOptions: ToastOptions =
				typeof options === "string" ? { title: options } : options;
			const title = normalizedOptions.title?.trim();

			if (!title) return undefined;

			const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			const type = isToastType(normalizedOptions.type)
				? normalizedOptions.type
				: "success";
			const message = normalizedOptions.message?.trim() || "";
			const duration = Number.isFinite(normalizedOptions.duration)
				? Math.max(1000, normalizedOptions.duration ?? TOAST_DURATION_MS)
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
		},
		[dismissToast],
	);

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
