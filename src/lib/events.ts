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
}

// Subscribes to GET /events (SSE) for the component's lifetime and calls
// onEvent for each notification. EventSource reconnects on drop natively,
// so callers don't need their own reconnect logic.
export function useExpenseEvents(onEvent: (event: ExpenseEvent) => void) {
  const onEventRef = React.useRef(onEvent);
  onEventRef.current = onEvent;

  React.useEffect(() => {
    const source = new EventSource(`${API_URL}/events`);
    source.onmessage = (e) => {
      try {
        onEventRef.current(JSON.parse(e.data) as ExpenseEvent);
      } catch {
        // malformed payload -- drop it, next event still gets through
      }
    };
    return () => source.close();
  }, []);
}
