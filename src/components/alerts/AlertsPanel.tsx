import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, type AlertList, type ExpenseAlert } from "@/lib/api";
import { normalizeAlertList, useAlerts } from "@/lib/alerts";
import { useT } from "@/lib/language";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Button } from "@/components/ui/button";

interface AlertsPanelProps {
  onClose: () => void;
}

export function AlertsPanel({ onClose }: AlertsPanelProps) {
  const t = useT();
  const navigate = useNavigate();
  const { refreshUnreadCount } = useAlerts();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = React.useState<AlertList>({ current: [], earlier: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setAlerts(normalizeAlertList(await api.alerts.list(50, 0)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [t.alerts.failedToLoad]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-alerts-control]")) return;
      if (panelRef.current && !panelRef.current.contains(target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function openAlert(alert: ExpenseAlert) {
    try {
      if (!alert.read_at) await api.alerts.markRead(alert.id);
      await refreshUnreadCount();
      onClose();
      if (alert.related_expense_id != null) navigate(`/search?expense=${alert.related_expense_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToMarkRead);
    }
  }

  async function dismissAlert(alert: ExpenseAlert) {
    try {
      await api.alerts.dismiss(alert.id);
      await Promise.all([load(), refreshUnreadCount()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToDismiss);
    }
  }

  async function markAllRead() {
    try {
      await api.alerts.markAllRead();
      await Promise.all([load(), refreshUnreadCount()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToMarkRead);
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t.alerts.title}
      className="absolute right-0 top-11 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-panel border border-border bg-card p-4 text-card-foreground shadow-xl"
    >
      <div className="flex items-center justify-between gap-3 pb-2">
        <h2 className="text-base font-semibold">{t.alerts.title}</h2>
        {alerts.current.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-auto px-1 py-1 text-primary" onClick={markAllRead}>
            {t.alerts.markAllRead}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="py-5 text-sm text-muted-foreground">{t.common.loading}</p>
      ) : error ? (
        <p className="py-5 text-sm text-destructive" role="alert">{error}</p>
      ) : alerts.current.length === 0 ? (
        <p className="py-5 text-sm text-muted-foreground">{t.alerts.noCurrent}</p>
      ) : (
        <div>
          {alerts.current.slice(0, 3).map((alert) => (
            <AlertItem key={alert.id} alert={alert} compact onOpen={() => openAlert(alert)} onDismiss={() => dismissAlert(alert)} />
          ))}
        </div>
      )}

      <Link
        to="/alerts"
        onClick={onClose}
        className="mt-1 flex items-center justify-center gap-1 border-t border-border pt-3 text-sm font-medium text-primary hover:underline"
      >
        {t.alerts.viewAll}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
