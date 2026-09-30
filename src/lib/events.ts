import * as React from "react";

const API_URL = import.meta.env.VITE_API_URL;

// Mirrors the JSON built by fn_notify_expense_event() (db/functions.sql) --
// fired on every expense insert or delete regardless of source (n8n inbox
// agent, the Go API, or a manual SQL statement). "deleted" events only carry
// an id; the rest are only present on "created". "resync" never comes from
// the server -- see ensureSharedSource() below.
export interface ExpenseEvent {
  type: "created" | "deleted" | "resync";
  id: number;
  merchant?: string | null;
  entity?: string;
  amount?: number | null;
  currency?: string | null;
  date_event?: string;
  confidence?: number | null;
  reviewed?: boolean;
  flag_type?: string | null;
}

const RESYNC_EVENT: ExpenseEvent = { type: "resync", id: 0 };

const listeners = new Set<(event: ExpenseEvent) => void>();
let sharedSource: EventSource | null = null;
let visibilityHandlerAttached = false;

function notifyAll(event: ExpenseEvent) {
  listeners.forEach((listener) => listener(event));
}

function ensureSharedSource() {
  if (!visibilityHandlerAttached) {
    visibilityHandlerAttached = true;
    // A backgrounded or locked phone can silently drop the SSE connection --
    // EventSource reconnects on its own but has no way to replay whatever
    // fired while it was down (Postgres/the API don't buffer past events
    // either). Treat the tab becoming visible again as "might have missed
    // something" and let every subscriber refetch, instead of waiting for a
    // manual refresh that may never come.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") notifyAll(RESYNC_EVENT);
    });
  }

  if (sharedSource) return;
  const source = new EventSource(`${API_URL}/events`);
  sharedSource = source;
  // Fires on the first connect and again after every automatic reconnect --
  // either way the stream is resuming from an unknown gap, so treat it the
  // same as regaining visibility above.
  source.onopen = () => notifyAll(RESYNC_EVENT);
  source.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data) as ExpenseEvent;
      notifyAll(event);
    } catch {
      // Malformed payload -- drop it; the next event still gets through.
    }
  };
}

// Components in one browser tab share a single SSE connection. This avoids
// page requests being starved by several long-lived connections to the API.
export function useExpenseEvents(onEvent: (event: ExpenseEvent) => void) {
  const onEventRef = React.useRef(onEvent);
  onEventRef.current = onEvent;

  React.useEffect(() => {
    const listener = (event: ExpenseEvent) => onEventRef.current(event);
    listeners.add(listener);
    ensureSharedSource();
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        sharedSource?.close();
        sharedSource = null;
      }
    };
  }, []);
}
