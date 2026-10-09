// Service worker. Two jobs: being installable (a registered worker with a
// fetch handler), and showing Web Push notifications for the duplicate /
// unusual-expense alerts. It caches nothing and answers no requests itself,
// so every fetch goes to the network exactly as in a normal browser tab (API
// calls, the SSE stream and fresh deploys are never served stale).

// false = Android plays its normal notification sound/vibration, like any
// other app (the user can still mute this site in Android's notification
// settings). Set to true to make these notifications silent.
const SILENT = false;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Not JSON -- fall back to the generic title below.
  }
  event.waitUntil(
    (async () => {
      // With the app on screen the in-app alert (and SSE) already tells the
      // user. Chrome allows skipping the notification only while a window of
      // the site is visible, which is exactly this case.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((w) => w.visibilityState === "visible")) return;

      // The server sends the icon-badge total with the push (same number the
      // app computes itself). Missing means it couldn't be computed: leave
      // the badge alone rather than show a wrong one.
      if (typeof data.badge === "number") {
        try {
          if (data.badge > 0) await self.navigator.setAppBadge(data.badge);
          else await self.navigator.clearAppBadge();
        } catch {
          // Badging unsupported or not allowed: the notification still shows.
        }
      }

      await self.registration.showNotification(data.title || "MiHarina", {
        body: data.body || "",
        tag: data.tag || "miharina-alert", // a newer one replaces the older of its type
        icon: "/icon-192.png",
        silent: SILENT,
        data: { url: data.url || "/alerts" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/alerts";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of windows) {
        await w.focus();
        if ("navigate" in w) {
          try {
            await w.navigate(url);
          } catch {
            // Cross-origin or detached window; focusing it is enough.
          }
        }
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
