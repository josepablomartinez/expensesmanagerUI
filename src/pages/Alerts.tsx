import * as React from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, type AlertList, type ExpenseAlert } from "@/lib/api";
import { normalizeAlertList, useAlerts } from "@/lib/alerts";
import { useT } from "@/lib/language";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Button } from "@/components/ui/button";

export default function Alerts() {
  const t = useT();
  const navigate = useNavigate();
  const { revision, notifyAlertsChanged } = useAlerts();
  const [alerts, setAlerts] = React.useState<AlertList>({ current: [], earlier: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setAlerts(normalizeAlertList(await api.alerts.list()));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [t.alerts.failedToLoad]);

  React.useEffect(() => {
    load();
  }, [load, revision]);

  async function openAlert(alert: ExpenseAlert) {
    try {
      if (!alert.read_at) {
        await api.alerts.markRead(alert.id);
        await notifyAlertsChanged();
      }
      if (alert.related_expense_id != null) navigate(`/search?expense=${alert.related_expense_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToMarkRead);
    }
  }

  async function dismissAlert(alert: ExpenseAlert) {
    try {
      await api.alerts.dismiss(alert.id);
      await notifyAlertsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToDismiss);
    }
  }

  async function markAllRead() {
    try {
      await api.alerts.markAllRead();
      await notifyAlertsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.alerts.failedToMarkRead);
    }
  }

  const empty = !loading && !error && alerts.current.length === 0 && alerts.earlier.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          aria-label={t.alerts.backToHome}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h1 className="min-w-0 flex-1 text-xl font-semibold">{t.alerts.title}</h1>
        {alerts.current.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={markAllRead}>
            {t.alerts.markAllRead}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : empty ? (
        <div className="flex flex-col items-center rounded-panel border border-dashed border-border bg-card px-5 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-medium">{t.alerts.allClear}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.alerts.emptyDescription}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="current-alerts-heading">
            <h2 id="current-alerts-heading" className="mb-2 text-sm font-semibold">{t.alerts.current}</h2>
            {alerts.current.length === 0 ? (
              <p className="rounded-panel border border-border bg-card p-4 text-sm text-muted-foreground">{t.alerts.noCurrent}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {alerts.current.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onOpen={() => openAlert(alert)} onDismiss={() => dismissAlert(alert)} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="earlier-alerts-heading">
            <h2 id="earlier-alerts-heading" className="mb-2 text-sm font-semibold">{t.alerts.earlier}</h2>
            {alerts.earlier.length === 0 ? (
              <p className="rounded-panel border border-border bg-card p-4 text-sm text-muted-foreground">{t.alerts.noEarlier}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {alerts.earlier.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onOpen={() => openAlert(alert)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
