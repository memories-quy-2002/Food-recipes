import React from "react";

const ToastViewport = ({ toasts, onDismiss }) => {
	if (!toasts.length) return null;

	return (
		<div className="toast-viewport" aria-live="polite" aria-atomic="true">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`toast-viewport__item toast-viewport__item--${toast.type}`}
					role="status"
				>
					<p>{toast.title}</p>
					<button
						type="button"
						onClick={() => onDismiss(toast.id)}
						aria-label="Dismiss notification"
					>
						Close
					</button>
				</div>
			))}
		</div>
	);
};

export default ToastViewport;
