// Minimal service worker: it exists so the app is installable. It caches
// nothing and answers no requests itself, so every fetch goes to the network
// exactly as it does in a normal browser tab (API calls, the SSE stream and
// fresh deploys are never served stale).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
