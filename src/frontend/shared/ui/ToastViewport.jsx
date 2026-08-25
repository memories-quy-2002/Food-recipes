import React from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const toastTone = {
	success: {
		icon: CheckCircle2,
		className: "border-secondary/60 bg-secondary/30 text-foreground",
		iconClassName: "text-primary",
	},
	error: {
		icon: CircleAlert,
		className: "border-destructive/30 bg-destructive/10 text-destructive",
		iconClassName: "text-destructive",
	},
	info: {
		icon: Info,
		className: "border-border bg-card text-card-foreground",
		iconClassName: "text-primary",
	},
};

const ToastViewport = ({ toasts, onDismiss }) => {
	if (!toasts.length) return null;

	return (
		<div
			className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[min(26rem,calc(100vw-2.5rem))]"
			aria-label="Notifications"
			aria-live="polite"
			aria-atomic="false"
		>
			{toasts.map((toast) => {
				const tone = toastTone[toast.type] || toastTone.info;
				const Icon = tone.icon;

				return (
					<div
						key={toast.id}
						className={`pointer-events-auto grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border p-4 shadow-lg shadow-foreground/10 backdrop-blur ${tone.className}`}
						role={toast.type === "error" ? "alert" : "status"}
						aria-atomic="true"
					>
						<Icon className={`mt-0.5 size-5 shrink-0 ${tone.iconClassName}`} aria-hidden="true" />
						<div className="min-w-0">
							<p className="text-sm font-bold leading-5">{toast.title}</p>
							{toast.message ? (
								<p className="mt-1 text-sm leading-5 text-muted-foreground">{toast.message}</p>
							) : null}
						</div>
						<button
							type="button"
							className="-mr-1 -mt-1 inline-flex size-11 items-center justify-center rounded-full text-foreground transition hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onClick={() => onDismiss(toast.id)}
							aria-label={`Dismiss notification: ${toast.title}`}
						>
							<X className="size-4" aria-hidden="true" />
						</button>
					</div>
				);
			})}
		</div>
	);
};

export default ToastViewport;
