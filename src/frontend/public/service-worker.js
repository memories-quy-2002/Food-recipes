const SHELL_CACHE = "food-recipes-shell-v1";
const SHELL_ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	if (url.pathname.startsWith("/api/") || url.pathname.includes("/auth/")) return;
	event.respondWith(fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/index.html"))));
});

self.addEventListener("message", (event) => {
	if (event.data?.type !== "CACHE_PUBLIC_RECIPE" || typeof event.data.url !== "string") return;
	event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add(event.data.url)));
});
