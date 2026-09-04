import * as React from "react";
import { api, type AlertList } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";

interface AlertsContextValue {
  unreadCount: number | null;
  revision: number;
  refreshUnreadCount: () => Promise<void>;
  notifyAlertsChanged: () => Promise<void>;
}

const AlertsContext = React.createContext<AlertsContextValue | null>(null);

export function normalizeAlertList(alerts: AlertList): AlertList {
  const resolvedFromCurrent = alerts.current.filter((alert) => Boolean(alert.resolved_at));
  return {
    current: alerts.current.filter((alert) => !alert.resolved_at),
    earlier: [...resolvedFromCurrent, ...alerts.earlier].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = React.useState<number | null>(null);
  const [revision, setRevision] = React.useState(0);

  const refreshUnreadCount = React.useCallback(async () => {
    try {
      const [result, list] = await Promise.all([api.alerts.unreadCount(), api.alerts.list(200, 0)]);
      const resolvedUnread = list.current.filter((alert) => Boolean(alert.resolved_at)).length;
      setUnreadCount(Math.max(0, result.count - resolvedUnread));
    } catch {
      setUnreadCount(null);
    }
  }, []);

  React.useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const notifyAlertsChanged = React.useCallback(async () => {
    setRevision((value) => value + 1);
    await refreshUnreadCount();
  }, [refreshUnreadCount]);

  useExpenseEvents(notifyAlertsChanged);

  return (
    <AlertsContext.Provider value={{ unreadCount, revision, refreshUnreadCount, notifyAlertsChanged }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const value = React.useContext(AlertsContext);
  if (!value) throw new Error("useAlerts must be used within AlertsProvider");
  return value;
}
