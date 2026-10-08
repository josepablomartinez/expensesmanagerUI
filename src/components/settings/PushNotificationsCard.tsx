import * as React from "react";
import { api, ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/language";

// The VAPID key arrives as URL-safe base64; pushManager.subscribe wants bytes.
function keyToBytes(key: string): Uint8Array<ArrayBuffer> {
  const padded = (key + "=".repeat((4 - (key.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type Status = "checking" | "unavailable" | "off" | "on";

// Per-device opt-in for Web Push (duplicate / unusual-expense alerts). It
// lives outside the settings form on purpose: the choice belongs to this
// browser, not the account, and applies the moment it's flipped. Renders
// nothing where push can't work (no service worker -- e.g. the dev server --
// no PushManager, or a server without VAPID keys).
export function PushNotificationsCard() {
  const t = useT();
  const [status, setStatus] = React.useState<Status>("checking");
  const [publicKey, setPublicKey] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (!cancelled) setStatus("unavailable");
        return;
      }
      try {
        const [reg, config] = await Promise.all([navigator.serviceWorker.getRegistration(), api.push.config()]);
        if (cancelled) return;
        if (!reg) {
          setStatus("unavailable");
          return;
        }
        setPublicKey(config.public_key);
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(sub && Notification.permission === "granted" ? "on" : "off");
      } catch {
        // Includes the API's 503 when push isn't configured.
        if (!cancelled) setStatus("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function change(enable: boolean) {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (enable) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError(t.settings.pushBlocked);
          return;
        }
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
        await api.push.subscribe(sub.toJSON());
        setStatus("on");
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.push.unsubscribe(sub.endpoint);
          await sub.unsubscribe();
        }
        setStatus("off");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.settings.pushFailed);
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking" || status === "unavailable") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.settings.pushTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <div className="flex items-start justify-between gap-4 py-1">
          <div className="min-w-0">
            <label htmlFor="push-enabled" className="text-sm font-medium text-foreground">
              {t.settings.pushToggle}
            </label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.settings.pushHelp}</p>
          </div>
          <Switch
            id="push-enabled"
            checked={status === "on"}
            onCheckedChange={change}
            disabled={busy}
            aria-label={t.settings.pushToggle}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
