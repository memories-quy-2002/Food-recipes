import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import ToastViewport from "@/shared/ui/ToastViewport";

const TOAST_DURATION_MS = 2600;

const ToastContext = createContext({
	showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);
	const timeoutRefs = useRef(new Map());

	const dismissToast = (toastId) => {
		setToasts((currentToasts) =>
			currentToasts.filter((toast) => toast.id !== toastId)
		);

		const timeoutId = timeoutRefs.current.get(toastId);
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutRefs.current.delete(toastId);
		}
	};

	const showToast = ({ title, type = "success" }) => {
		if (!title) return;

		const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		setToasts((currentToasts) => [...currentToasts, { id: toastId, title, type }]);

		const timeoutId = window.setTimeout(() => {
			dismissToast(toastId);
		}, TOAST_DURATION_MS);
		timeoutRefs.current.set(toastId, timeoutId);
	};

	useEffect(() => {
		return () => {
			timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
			timeoutRefs.current.clear();
		};
	}, []);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<ToastViewport toasts={toasts} onDismiss={dismissToast} />
		</ToastContext.Provider>
	);
};

export default ToastProvider;
