import { useEffect, type ReactElement } from "react";
import { offlineOperationQueue } from "./operationQueue";
import { syncOfflineOperation } from "./offlineSync";

const OfflineSyncBridge = (): ReactElement | null => {
	useEffect(() => {
		const flush = () => { void offlineOperationQueue.flush(syncOfflineOperation); };
		window.addEventListener("online", flush);
		if (navigator.onLine) flush();
		return () => window.removeEventListener("online", flush);
	}, []);
	return null;
};

export default OfflineSyncBridge;
