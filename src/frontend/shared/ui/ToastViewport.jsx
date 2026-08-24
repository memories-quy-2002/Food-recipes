import React from "react";

const ToastViewport = ({ toasts, onDismiss }) => {
	if (!toasts.length) return null;

	return (
		<div
			className="toast-viewport"
			aria-label="Notifications"
			aria-live="polite"
			aria-atomic="false"
		>
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`toast-viewport__item toast-viewport__item--${toast.type}`}
					role={toast.type === "error" ? "alert" : "status"}
					aria-atomic="true"
				>
					<span className="toast-viewport__indicator" aria-hidden="true" />
					<div className="toast-viewport__content">
						<p className="toast-viewport__title">{toast.title}</p>
						{toast.message ? (
							<p className="toast-viewport__message">{toast.message}</p>
						) : null}
					</div>
					<button
						type="button"
						onClick={() => onDismiss(toast.id)}
						aria-label={`Dismiss notification: ${toast.title}`}
					>
						<span aria-hidden="true">×</span>
					</button>
				</div>
			))}
		</div>
	);
};

export default ToastViewport;
