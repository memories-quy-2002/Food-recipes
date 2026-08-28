export const SERVICE_WORKER_PATH = "/service-worker.js";

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
	try {
		return await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" });
	} catch {
		return null;
	}
};
