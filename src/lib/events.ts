import * as React from "react";

const API_URL = import.meta.env.VITE_API_URL;

// Mirrors the JSON built by fn_notify_expense_event() (db/functions.sql) --
// fired on every expense insert or delete regardless of source (n8n inbox
// agent, the Go API, or a manual SQL statement). "deleted" events only carry
// an id; the rest are only present on "created".
export interface ExpenseEvent {
  type: "created" | "deleted";
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

const listeners = new Set<(event: ExpenseEvent) => void>();
let sharedSource: EventSource | null = null;

function ensureSharedSource() {
  if (sharedSource) return;
  sharedSource = new EventSource(`${API_URL}/events`);
  sharedSource.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data) as ExpenseEvent;
      listeners.forEach((listener) => listener(event));
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
